"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function SectionNav({
  sections,
}: {
  sections: { id: string; label: string }[];
}) {
  const [active, setActive] = React.useState(sections[0]?.id);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-140px 0px -70% 0px", threshold: 0 }
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav className="sticky top-[4.5rem] z-20 -mx-4 mt-6 border-b border-hairline bg-canvas/95 px-4 backdrop-blur sm:mx-0 sm:px-0">
      <div className="no-scrollbar flex gap-7 overflow-x-auto">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={cn(
              "overline-sm shrink-0 py-4 transition-colors",
              active === s.id ? "text-accent-dark" : "text-muted hover:text-ink"
            )}
          >
            {s.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
