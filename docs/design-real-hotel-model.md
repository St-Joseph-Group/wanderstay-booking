# Design: Real Hotel Model — Room Types + Stripe Payments

> Office-hours design doc. **No code yet** — this is the plan to review before building.
> Date: 2026-06-23 · App: Wanderstay (live at wanderstay-booking.vercel.app)

## Review revisions (plan-eng-review, 2026-06-23)

Three decisions from the engineering review, applied below:

1. **Scope split.** This PR = room types + inventory + "Choose your room" UX against
   the existing **mock checkout**. **Stripe is deferred to a separate PR** (see the
   Stripe section, now marked DEFERRED). Verify oversell-safety before adding a
   payments+webhook failure surface.
2. **Oversell model = room instances + the existing exclusion constraint** (NOT the
   advisory-lock-and-count originally drafted). Each room type owns N physical
   `room_instances`; a booking books a specific instance; the existing
   `daterange` exclusion constraint moves to `(room_instance_id, …)` and stays the
   **declarative** source of truth. This keeps the impossible-to-oversell guarantee
   the app already relies on.
3. **`listings.price_per_night` is dropped** (price lives on room types); search/cards
   compute "from {min room price}". No stale half-migrated column.

## Context

Wanderstay v1 is Airbnb-style: one listing = one bookable unit, priced per night,
with mock checkout. To feel like **Agoda**, a property needs **multiple room types**
(Deluxe King, Twin, Suite…), each separately priced and bookable with its own
inventory, and **real payments**. This doc covers both, because room types change
what a "booking" is, and that's the right moment to put a real payment behind it.

Two hard problems drive the design:
1. **Inventory, not a binary lock.** Today double-booking is blocked by a Postgres
   exclusion constraint (one booking per listing per date range). A room type with
   5 identical rooms must allow up to 5 overlapping bookings, then block the 6th.
   The constraint approach no longer fits.
2. **No overselling under concurrency.** Two guests buying the last room at the same
   instant must not both succeed. This needs an atomic check-and-hold, not a
   read-then-write.

## Scope

**In:** room types with per-night price + inventory; inventory-based availability;
oversell-safe booking; migration of existing whole-unit listings; Stripe test-mode
Checkout; host UI to manage room types; guest UI to pick a room.

**Out (separate scope):** channel-manager sync, dynamic/seasonal pricing calendars,
multi-currency, refunds/cancellation policies beyond a simple flag, real payouts to
hosts. Flag these as follow-ons, don't fold them in.

## Data Model

New and changed tables (DDL shown as design — not yet applied). Supabase project
`RoomServiceReservation` (`yeabajvdjgwaenhjnqgk`), `public` schema.

```
-- New: a property's bookable room classes
room_types (
  id uuid pk,
  listing_id uuid -> listings(id) on delete cascade,
  name text,                      -- "Deluxe King"
  description text,
  price_per_night integer,        -- cents (the source of truth for price)
  cleaning_fee integer default 0,
  max_guests integer,
  beds integer, bathrooms numeric(3,1),
  size_sqm integer null,
  amenities text[] default '{}',
  position integer default 0
)

-- New: physical rooms. N instances per room type = the inventory.
-- A booking books ONE instance; the exclusion constraint lives here.
room_instances (
  id uuid pk,
  room_type_id uuid -> room_types(id) on delete cascade,
  label text                      -- "Room 101" / or just an index
)

-- Changed: a booking targets a specific physical room instance.
-- room_type_id + listing_id kept denormalized for queries.
bookings
  + room_instance_id uuid -> room_instances(id)
  + room_type_id uuid -> room_types(id)
  -- exclusion constraint MOVES from listing-level to instance-level:
  EXCLUDE USING gist (room_instance_id WITH =,
                      daterange(check_in, check_out, '[)') WITH &&)
    WHERE (status <> 'cancelled')

-- Photos can hang off a room type too
listing_photos + room_type_id uuid null   -- null = property-level photo
```

**`listings` becomes the "hotel" header** (name, location, description, star class,
property amenities). `listings.price_per_night` is **dropped**; the listing shows a
"from {min room-type price}" rollup computed in queries.

**Inventory = `count(room_instances)` for a room type.** A host "5 Deluxe Kings"
creates 5 instances. "N left" for a date range = instances with no overlapping
non-cancelled booking.

### Migration (keeps v1 data working) — one transaction

Run as a **single transaction** so there is never a window where bookings have no
overlap guard (we drop the old listing-level constraint and add the instance-level
one in the same migration). **Back up `bookings` and `listings` first.**

1. Create `room_types`, `room_instances`; add `room_instance_id` + `room_type_id` to
   `bookings`.
2. For each existing listing → one room type "Entire place" (price/capacity from the
   listing) → **one** `room_instance`.
3. Re-point every existing booking to that listing's single instance.
4. Drop `listings.bookings_no_overlap`; add the instance-level `EXCLUDE` constraint.
5. Drop `listings.price_per_night`.

After migration the old whole-unit behavior is just the "1 instance" case — no data
loss, no broken pages. Regenerate TS types.

## Availability & No-Oversell (the core)

**Decision (review): room instances + the existing exclusion constraint.** Keep a
**declarative** DB guarantee — the same impossible-to-oversell property the app
already has — instead of a procedural advisory lock that every write path must
remember to take.

- **Read path (display "N left"):** `room_type_availability(room_type_id, check_in,
  check_out)` = count of `room_instances` for that type with **no** overlapping
  non-cancelled booking over `daterange(check_in, check_out, '[)')`. Drives the
  "N left" badge; 0 → date range disabled.

- **Write path (oversell-safe, no retry loop):** `book_room_instance(room_type_id,
  check_in, check_out, guest, …)` (`SECURITY DEFINER`):
  1. Claim a free instance atomically:
     ```sql
     SELECT ri.id FROM room_instances ri
     WHERE ri.room_type_id = $1
       AND NOT EXISTS (
         SELECT 1 FROM bookings b
         WHERE b.room_instance_id = ri.id AND b.status <> 'cancelled'
           AND daterange(b.check_in, b.check_out, '[)')
               && daterange($2, $3, '[)'))
     LIMIT 1
     FOR UPDATE SKIP LOCKED;        -- concurrent bookings grab DIFFERENT free rooms
     ```
  2. If none → raise `no_availability`. Else insert the booking on that instance.
  3. The instance-level `EXCLUDE` constraint is the backstop: even if two requests
     somehow target the same instance, the second insert fails with `23P01` and the
     action returns "just booked" — exactly the pattern the current code already
     handles at [bookings.ts:99](lib/actions/bookings.ts:99).

  `FOR UPDATE SKIP LOCKED` makes concurrency a non-event: N racers for N free rooms
  each claim a distinct one; the (N+1)th finds nothing and is cleanly rejected. No
  advisory lock, no count-then-insert TOCTOU, no per-night inventory rows.

Reuse `lib/pricing.ts` `computePricing()` unchanged — already the single source of
truth; feed it the room type's price/fees instead of the listing's.

## Stripe Test Payments (DEFERRED — separate PR, not in this build)

> Review decision: ship the room model against the existing mock checkout first,
> verify oversell-safety, THEN do this as its own PR. Kept here for continuity.
> When built, `book_room_instance` creates the booking as `pending` (holding the
> claimed instance), and the webhook flips it to `confirmed`; pending holds older
> than ~30 min are excluded from availability and swept to `cancelled`.

Swap the mock card form for **Stripe Checkout (test mode)** — least code, hosted,
handles 3DS/test cards for free.

- **Flow:** booking action creates the booking `status = pending` (holding a unit via
  `book_room_type`), then creates a Stripe Checkout Session and redirects. On
  `checkout.session.completed`, a **webhook** flips the booking to `confirmed`.
- **Abandonment:** pending holds expire. A `pending` booking older than ~30 min is
  treated as not-holding inventory (filter `pending AND created_at > now()-30min`
  in availability), and a daily cleanup marks them `cancelled`. Keeps phantom holds
  from eating inventory.
- **New surface:** `app/api/stripe/webhook/route.ts` (Node runtime, raw body for
  signature verify). Env vars on Vercel: `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- **Seam already exists:** the current checkout/booking split (`app/book/[listingId]`
  → `lib/actions/bookings.ts`) was built for exactly this swap. The mock "always
  succeeds" form is the only thing that goes.

## UI Changes

- **Listing detail** (`app/listings/[id]/page.tsx`): replace the single
  `components/booking-card.tsx` with a **"Choose your room"** list — one card per room
  type (price, capacity, beds, "{n} left", Reserve). Keep the shared date picker at
  the top; each room card reflects availability for the chosen dates. This is the
  signature Agoda screen.
- **Search** (`app/search/page.tsx`, `lib/queries.ts`): list card shows "from
  {min room-type price}"; price filters query against room-type prices.
- **Host** (`app/host/listings/new` + `/[id]/edit`, `components/listing-form.tsx`):
  add a **Room types** step — add/remove room types, each with name, price, inventory,
  capacity, photos.
- **Checkout** (`app/book/...`): carries `room_type_id`; summary shows the room name.
- **Booking record / trips / host dashboard**: show room type name alongside the
  property.

## Build Phases (this PR — Stripe excluded)

1. **Test framework** — add Vitest + one DB-integration test harness. The booking path
   is now critical; it gets tests before it changes. (CC: ~20 min)
2. **Schema + migration** — room_types, room_instances, booking columns,
   `room_type_availability`, `book_room_instance` (with `FOR UPDATE SKIP LOCKED`),
   move the exclusion constraint to instance-level, migrate existing listings to one
   "Entire place" instance, drop `listings.price_per_night`. One transaction.
   Regenerate TS types. (CC: ~50 min)
3. **Read path** — queries (search "from {min price}", detail availability) + listing
   detail "Choose your room" UI. Booking goes through `book_room_instance`, confirmed
   via the existing **mock** checkout. (CC: ~60 min)
4. **Host room-type management** — wizard step: add room types, set instance count.
   (CC: ~45 min)
5. **The oversell test + polish** — concurrent-booking test (2 instances, 3 racers →
   2 win), adjacent-date test, cancel-frees-instance test, migration test; "N left"
   badges, sold-out states, `get_advisors` lint. (CC: ~45 min)

**Separate follow-up PR:** Stripe test payments (see DEFERRED section).

## Risks & Decisions

- **Oversell race** — handled declaratively: `FOR UPDATE SKIP LOCKED` claims a free
  instance, the instance-level `EXCLUDE` constraint is the hard backstop. The DB
  enforces it regardless of code path — no procedural lock to forget. This is the one
  place correctness must hold; everything else is display.
- **Stripe webhook on Vercel** — needs the raw request body and the webhook secret;
  test locally with the Stripe CLI `stripe listen --forward-to`. Don't confirm
  bookings from the redirect alone (user can close the tab) — the webhook is the
  source of truth.
- **Migration is one-way-ish** — back up `bookings`/`listings` before running; the
  "Entire place" conversion is reversible in principle but plan to not need to.
- **Demo data** — reseed a couple of properties with 2-3 real room types each so the
  "Choose your room" screen looks like Agoda, not a single-row list.

## Verification

- DB: after migration, every existing listing has exactly one room type and every
  existing booking points to it; `get_advisors` clean; RLS on `room_types`.
- Oversell: set a room type `total_rooms = 1`, fire two overlapping bookings
  concurrently → exactly one succeeds, the other gets the clean "just booked" error.
- "2 left": book 3 of 5 rooms for overlapping dates → card shows "2 left"; book the
  last → date range disabled.
- Stripe: complete a test-card checkout → webhook flips booking to `confirmed`, shows
  in Trips; abandon a checkout → booking stays `pending`, inventory frees after expiry.
- Host: create a property with two room types and different inventory → both appear on
  the listing and are independently bookable.

## The Assignment

Before writing any code: **open one real Agoda hotel page and screenshot the
"Choose your room" section.** That table — room name, occupancy icons, price,
"Only N left", and the per-room "Reserve" — is the exact UI Phase 2 must reproduce.
Decide one thing from it: do room types each get their own date selection, or does
one date range up top drive all room cards? (Recommend: one date range up top —
simpler, and how most hotel pages work.) That single decision shapes the listing
detail rebuild.

---
**Next step when ready to build:** run `/plan-eng-review` on this doc to pressure-test
the schema + oversell strategy, then implement Phase 1.
