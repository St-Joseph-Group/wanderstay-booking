# Wanderstay 🏡

A full end-to-end booking marketplace (think Airbnb / Agoda), built with **Next.js 16 (App Router)** and **Supabase**. Guests can search stays, pick dates, and book through a realistic mock checkout; hosts can list properties and manage incoming reservations.

## Features

**Guests**
- Browse a homepage of featured stays with a destination/date/guests search bar
- Search results with filters (price, guests, property type, amenities) and sorting
- Rich listing pages: photo gallery + lightbox, amenities, map, reviews
- Live price breakdown and a calendar that disables already-booked dates
- Mock checkout → instant booking confirmation → **Trips** dashboard
- Save places to **Wishlists** (favorites)

**Hosts**
- "Become a host" onboarding
- Create/edit listings with photo upload to Supabase Storage
- Host dashboard: your listings, stats, and incoming bookings

**Platform**
- Email/password auth (Supabase Auth) with route protection
- Postgres + Row Level Security on every table
- Double-booking prevention via a Postgres `daterange` exclusion constraint and an `is_listing_available()` function — enforced server-side

## Tech stack

- Next.js 16 (App Router, Server Components + Server Actions), TypeScript
- Tailwind CSS v4 + hand-built UI primitives
- Supabase: Postgres, Auth, Storage, RLS
- `react-day-picker`, `date-fns`, `zod`, `lucide-react`
- OpenStreetMap embed for listing maps (no API key)

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. Environment variables live in `.env.local` (Supabase URL + anon key).

## Demo accounts

All demo accounts use the password **`password123`**.

| Role  | Email            |
| ----- | ---------------- |
| Guest | `alex@guest.com` |
| Guest | `sam@guest.com`  |
| Host  | `demo@host.com`  |
| Host  | `maria@host.com` |
| Host  | `kenji@host.com` |

You can also sign up with any new email — accounts are auto-confirmed (no email round-trip) for the demo.

## Project structure

```
app/                     Routes (home, search, listings, book, trips, host, auth, account)
components/              UI primitives + feature components (search bar, booking card, listing form…)
lib/
  supabase/             Browser/server/proxy Supabase clients (@supabase/ssr)
  actions/              Server actions (auth, bookings, host, favorites, profile)
  queries.ts            Typed data-fetching helpers
  pricing.ts            Single source of truth for booking price math
proxy.ts                Auth-session refresh middleware (Next 16 "proxy" convention)
```

## Notes

- Payments are mocked — no real charge is made. The checkout/booking split keeps a clean seam to drop in real Stripe later.
- The booking total is computed server-side in `lib/pricing.ts` and never trusted from the client.
