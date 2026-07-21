"use client";

import * as React from "react";
import Image from "next/image";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { createClient } from "@/lib/supabase/client";
import { AMENITIES, PROPERTY_TYPES } from "@/lib/constants";
import type { ListingFormState } from "@/lib/actions/host";
import type { Listing } from "@/lib/database.types";
import { cn } from "@/lib/utils";

type Action = (
  prev: ListingFormState,
  formData: FormData
) => Promise<ListingFormState>;

export function ListingForm({
  action,
  userId,
  initial,
  submitLabel = "Publish listing",
}: {
  action: Action;
  userId: string;
  initial?: (Listing & { photos: string[] }) | null;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState<ListingFormState, FormData>(
    action,
    undefined
  );
  const [amenities, setAmenities] = React.useState<string[]>(
    initial?.amenities ?? []
  );
  const [photos, setPhotos] = React.useState<string[]>(initial?.photos ?? []);
  const [uploading, setUploading] = React.useState(false);
  const [status, setStatus] = React.useState<"draft" | "published">(
    (initial?.status as "draft" | "published") ?? "published"
  );

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    const supabase = createClient();
    const uploaded: string[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("listing-photos")
        .upload(path, file, { upsert: false });
      if (error) {
        toast(`Upload failed: ${error.message}`, "error");
        continue;
      }
      const { data } = supabase.storage
        .from("listing-photos")
        .getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }
    setPhotos((p) => [...p, ...uploaded]);
    setUploading(false);
    e.target.value = "";
  }

  function toggleAmenity(a: string) {
    setAmenities((cur) =>
      cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]
    );
  }

  function dollars(cents: number | undefined) {
    return cents != null ? (cents / 100).toString() : "";
  }

  return (
    <form action={formAction} className="space-y-8">
      {/* Hidden state */}
      <input type="hidden" name="status" value={status} />
      {amenities.map((a) => (
        <input key={a} type="hidden" name="amenity" value={a} />
      ))}
      {photos.map((url) => (
        <input key={url} type="hidden" name="photo" value={url} />
      ))}

      {/* Photos */}
      <Section title="Photos" subtitle="Add a few photos of your place.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((url, i) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-xl border border-hairline bg-neutral-100"
            >
              <Image src={url} alt="" fill sizes="200px" className="object-cover" />
              {i === 0 && (
                <span className="absolute left-2 top-2 rounded bg-ink px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => setPhotos((p) => p.filter((u) => u !== url))}
                className="absolute right-2 top-2 rounded-full bg-white p-1 shadow opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5 text-ink" />
              </button>
            </div>
          ))}
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-hairline text-muted hover:border-ink hover:text-ink">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <ImagePlus className="h-6 w-6" />
            )}
            <span className="text-xs font-medium">
              {uploading ? "Uploading…" : "Add photos"}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onFiles}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </Section>

      {/* Basics */}
      <Section title="The basics">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            defaultValue={initial?.title}
            placeholder="Sunlit loft with skyline views"
            required
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="property_type">Property type</Label>
            <select
              id="property_type"
              name="property_type"
              defaultValue={initial?.property_type ?? "apartment"}
              className="h-11 w-full rounded-lg border border-hairline bg-white px-3 text-sm focus:border-ink focus:outline-none"
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="max_guests">Max guests</Label>
            <Input
              id="max_guests"
              name="max_guests"
              type="number"
              min={1}
              defaultValue={initial?.max_guests ?? 2}
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            rows={5}
            defaultValue={initial?.description}
            placeholder="Tell guests what makes your place special…"
            required
          />
        </div>
      </Section>

      {/* Rooms */}
      <Section title="Rooms & beds">
        <div className="grid grid-cols-3 gap-4">
          <NumberField name="bedrooms" label="Bedrooms" defaultValue={initial?.bedrooms ?? 1} min={0} />
          <NumberField name="beds" label="Beds" defaultValue={initial?.beds ?? 1} min={1} />
          <NumberField name="bathrooms" label="Bathrooms" defaultValue={initial?.bathrooms ?? 1} min={0.5} step={0.5} />
        </div>
      </Section>

      {/* Location */}
      <Section title="Location">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" defaultValue={initial?.city} required />
          </div>
          <div>
            <Label htmlFor="country">Country</Label>
            <Input id="country" name="country" defaultValue={initial?.country} required />
          </div>
        </div>
        <div>
          <Label htmlFor="address">Address (optional)</Label>
          <Input id="address" name="address" defaultValue={initial?.address ?? ""} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="lat">Latitude (optional)</Label>
            <Input id="lat" name="lat" type="number" step="any" defaultValue={initial?.lat ?? ""} placeholder="48.8566" />
          </div>
          <div>
            <Label htmlFor="lng">Longitude (optional)</Label>
            <Input id="lng" name="lng" type="number" step="any" defaultValue={initial?.lng ?? ""} placeholder="2.3522" />
          </div>
        </div>
      </Section>

      {/* Pricing */}
      <Section title="Pricing">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="price_per_night">Price per night (USD)</Label>
            <Input
              id="price_per_night"
              name="price_per_night"
              type="number"
              min={1}
              defaultValue={dollars(initial?.price_per_night)}
              placeholder="120"
              required
            />
          </div>
          <div>
            <Label htmlFor="cleaning_fee">Cleaning fee (USD)</Label>
            <Input
              id="cleaning_fee"
              name="cleaning_fee"
              type="number"
              min={0}
              defaultValue={dollars(initial?.cleaning_fee) || "0"}
              placeholder="40"
            />
          </div>
        </div>
      </Section>

      {/* Amenities */}
      <Section title="Amenities">
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((a) => (
            <button
              type="button"
              key={a}
              onClick={() => toggleAmenity(a)}
              className={cn(
                "rounded-full border px-3.5 py-2 text-sm transition-colors",
                amenities.includes(a)
                  ? "border-ink bg-ink text-white"
                  : "border-hairline text-ink hover:border-ink"
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </Section>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-3 border-t border-hairline pt-6 sm:flex-row sm:justify-end">
        <SubmitButton
          variant="outline"
          onClick={() => setStatus("draft")}
          label="Save as draft"
        />
        <SubmitButton
          variant="dark"
          onClick={() => setStatus("published")}
          label={submitLabel}
        />
      </div>
    </form>
  );
}

function SubmitButton({
  label,
  variant,
  onClick,
}: {
  label: string;
  variant: "dark" | "outline";
  onClick: () => void;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      size="lg"
      onClick={onClick}
      disabled={pending}
    >
      {pending ? "Saving…" : label}
    </Button>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function NumberField({
  name,
  label,
  defaultValue,
  min,
  step,
}: {
  name: string;
  label: string;
  defaultValue: number;
  min?: number;
  step?: number;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type="number"
        min={min}
        step={step}
        defaultValue={defaultValue}
        required
      />
    </div>
  );
}
