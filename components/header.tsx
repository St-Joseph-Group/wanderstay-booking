import Link from "next/link";
import { Globe } from "lucide-react";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { HeaderSearch } from "@/components/header-search";
import { getSessionProfile } from "@/lib/auth";

export async function Header() {
  const session = await getSessionProfile();
  const profile = session?.profile ?? null;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        {/* Curated search trigger → expands the full search in a modal */}
        <HeaderSearch />

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
