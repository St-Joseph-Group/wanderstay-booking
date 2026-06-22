import Link from "next/link";
import { Search, Globe } from "lucide-react";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { getSessionProfile } from "@/lib/auth";

export async function Header() {
  const session = await getSessionProfile();
  const profile = session?.profile ?? null;

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        {/* Compact search trigger */}
        <Link
          href="/search"
          className="hidden items-center gap-3 rounded-full border border-neutral-200 py-2 pl-5 pr-2 shadow-float transition-shadow hover:shadow-pop md:flex"
        >
          <span className="text-sm font-medium text-ink">Anywhere</span>
          <span className="h-5 w-px bg-neutral-200" />
          <span className="text-sm font-medium text-ink">Any week</span>
          <span className="h-5 w-px bg-neutral-200" />
          <span className="text-sm text-muted">Add guests</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white">
            <Search className="h-4 w-4" />
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={profile?.is_host ? "/host" : "/host/become"}
            className="hidden rounded-full px-4 py-2.5 text-sm font-semibold text-ink hover:bg-neutral-100 lg:block"
          >
            {profile?.is_host ? "Switch to hosting" : "Wanderstay your home"}
          </Link>
          <button className="hidden h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100 lg:flex">
            <Globe className="h-4 w-4 text-ink" />
          </button>
          <UserMenu profile={profile} />
        </div>
      </div>
    </header>
  );
}
