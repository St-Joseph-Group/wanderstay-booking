import { BadgeCheck, Clock, Star } from "lucide-react";
import { Avatar } from "@/components/avatar";

export function HostCard({
  host,
}: {
  host: {
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    created_at: string;
    is_verified: boolean;
    is_superhost: boolean;
    response_time_minutes: number | null;
  };
}) {
  const since = new Date(host.created_at);
  const year = Number.isNaN(since.getTime()) ? null : since.getFullYear();
  const responseLabel =
    host.response_time_minutes == null
      ? null
      : host.response_time_minutes < 60
        ? `${host.response_time_minutes} min`
        : `${Math.round(host.response_time_minutes / 60)} hr`;

  return (
    <div className="rounded-lg border border-line bg-surface p-5 shadow-card">
      <div className="flex items-center gap-4">
        <Avatar name={host.full_name} src={host.avatar_url} size={56} />
        <div>
          <p className="text-lg font-bold text-ink">
            Hosted by {host.full_name ?? "a host"}
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {host.is_superhost && (
              <span className="inline-flex items-center gap-1 rounded-md bg-brand px-2 py-0.5 text-[11px] font-semibold text-white">
                <Star className="h-3 w-3 fill-current" /> Superhost
              </span>
            )}
            {host.is_verified && (
              <span className="inline-flex items-center gap-1 rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-dark">
                <BadgeCheck className="h-3 w-3" /> Verified Host
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
        {year && <span>Hosting since {year}</span>}
        {responseLabel && (
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> Responds in ~{responseLabel}
          </span>
        )}
      </div>

      {host.bio && (
        <p className="mt-3 leading-relaxed text-ink">{host.bio}</p>
      )}
    </div>
  );
}
