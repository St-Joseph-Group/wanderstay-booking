import Link from "next/link";
import { Globe } from "lucide-react";

const columns = [
  {
    title: "Support",
    links: ["Help Center", "Guest protection", "Cancellation options", "Report a concern"],
  },
  {
    title: "Hosting",
    links: ["List your home", "Hosting resources", "Community forum"],
  },
  {
    title: "Wanderstay",
    links: ["Our story", "Careers", "Press", "Gift cards"],
  },
];

export function Footer() {
  return (
    <footer className="bg-brand text-white/70">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 border-b border-white/10 pb-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <p className="font-display text-2xl lowercase tracking-[0.14em] text-white">
              wanderstay
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              A considered collection of places to stay — from hosts who care
              about the details.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="overline mb-4 text-accent">{col.title}</h3>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l}>
                    <Link
                      href="#"
                      className="text-sm text-white/70 transition-colors hover:text-white"
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="overline-sm text-white/50">
            © {new Date().getFullYear()} Wanderstay, Inc. · A demo booking
            experience
          </p>
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Globe className="h-4 w-4" /> English (US) · USD
          </div>
        </div>
      </div>
    </footer>
  );
}
