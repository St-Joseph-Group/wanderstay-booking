import { MapPin } from "lucide-react";

export function ListingMap({
  lat,
  lng,
  label,
  landmarks,
  summary,
}: {
  lat: number | null;
  lng: number | null;
  label: string;
  landmarks?: { name: string; minutes: number }[];
  summary?: string | null;
}) {
  return (
    <div>
      {lat != null && lng != null && (
        <div className="overflow-hidden rounded-lg border border-hairline">
          <iframe
            title={`Map showing ${label}`}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02}%2C${lat - 0.02}%2C${lng + 0.02}%2C${lat + 0.02}&layer=mapnik&marker=${lat}%2C${lng}`}
            className="h-[360px] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}

      {summary && <p className="mt-4 leading-relaxed text-ink">{summary}</p>}

      {landmarks && landmarks.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {landmarks.map((l) => (
            <div
              key={l.name}
              className="flex items-center justify-between rounded-lg border border-hairline bg-surface px-3 py-2.5 text-sm"
            >
              <span className="inline-flex items-center gap-1.5 text-ink">
                <MapPin className="h-4 w-4 text-accent-dark" /> {l.name}
              </span>
              <span className="font-semibold text-muted">{l.minutes} min</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
