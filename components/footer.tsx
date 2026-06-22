import Link from "next/link";
import { Globe } from "lucide-react";

const columns = [
  {
    title: "Support",
    links: ["Help Center", "AirCover", "Cancellation options", "Report concern"],
  },
  {
    title: "Hosting",
    links: ["Wanderstay your home", "Hosting resources", "Community forum"],
  },
  {
    title: "Wanderstay",
    links: ["Newsroom", "Careers", "Investors", "Gift cards"],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 text-sm font-bold text-ink">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <Link
                      href="#"
                      className="text-sm text-muted hover:text-ink hover:underline"
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-neutral-200 pt-6 sm:flex-row sm:items-center">
          <p className="text-sm text-muted">
            © {new Date().getFullYear()} Wanderstay, Inc. · A demo booking
            marketplace
          </p>
          <div className="flex items-center gap-2 text-sm font-medium text-ink">
            <Globe className="h-4 w-4" /> English (US) · USD
          </div>
        </div>
      </div>
    </footer>
  );
}
