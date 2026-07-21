import Link from "next/link";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { HeaderSearch } from "@/components/header-search";
import { CurrencySelect } from "@/components/currency-select";
import { getSessionProfile } from "@/lib/auth";

export async function Header() {
  const session = await getSessionProfile();
  const profile = session?.profile ?? null;

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/95 backdrop-blur">
      <div className="mx-auto grid h-[4.5rem] max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6 lg:gap-8 lg:px-8">
        <div className="justify-self-start">
          <Logo />
        </div>

        {/* Inviting search bar → expands the full search in a modal */}
        <div className="mx-auto hidden w-full max-w-md md:block">
          <HeaderSearch />
        </div>

        <div className="flex items-center gap-2 justify-self-end">
          <Link
            href={profile?.is_host ? "/host" : "/host/become"}
            className="hidden rounded-full px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-brand/[0.06] lg:block"
          >
            {profile?.is_host ? "Hosting" : "List your home"}
          </Link>
          <CurrencySelect />
          <UserMenu profile={profile} />
        </div>
      </div>
    </header>
  );
}
