"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, UserCircle2 } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import type { Profile } from "@/lib/database.types";

export function UserMenu({ profile }: { profile: Profile | null }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-neutral-300 py-1.5 pl-3 pr-1.5 transition-shadow hover:shadow-float"
      >
        <Menu className="h-4 w-4 text-ink" />
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <UserCircle2 className="h-7 w-7 text-neutral-500" />
        )}
      </button>

      {open && (
        <div className="animate-fade-in absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-xl border border-neutral-200 bg-white py-2 shadow-pop">
          {profile ? (
            <>
              <div className="px-4 py-2">
                <p className="truncate text-sm font-semibold text-ink">
                  {profile.full_name ?? "Guest"}
                </p>
                <p className="text-xs text-muted">
                  {profile.is_host ? "Host" : "Guest"}
                </p>
              </div>
              <div className="my-1 h-px bg-neutral-100" />
              <MenuLink href="/trips">Trips</MenuLink>
              <MenuLink href="/wishlists">Wishlists</MenuLink>
              <MenuLink href="/account">Account</MenuLink>
              <div className="my-1 h-px bg-neutral-100" />
              {profile.is_host ? (
                <MenuLink href="/host">Host dashboard</MenuLink>
              ) : (
                <MenuLink href="/host/become">Become a host</MenuLink>
              )}
              <MenuLink href="/host/listings/new">List your place</MenuLink>
              <div className="my-1 h-px bg-neutral-100" />
              <form action={signOut}>
                <button
                  type="submit"
                  className="block w-full px-4 py-2.5 text-left text-sm text-ink hover:bg-neutral-50"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <MenuLink href="/signup" bold>
                Sign up
              </MenuLink>
              <MenuLink href="/login">Log in</MenuLink>
              <div className="my-1 h-px bg-neutral-100" />
              <MenuLink href="/host/become">Become a host</MenuLink>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  children,
  bold,
}: {
  href: string;
  children: React.ReactNode;
  bold?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block px-4 py-2.5 text-sm text-ink hover:bg-neutral-50 ${
        bold ? "font-semibold" : ""
      }`}
    >
      {children}
    </Link>
  );
}
