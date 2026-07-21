"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";

const EXAMPLES = [
  "3-day beach trip in Quezon under 2000 per night with 2 guests",
  "Weekend in Bali under $120 a night",
  "5-day food trip in Bangkok for 2 guests",
];

export function PlanTripSearch({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [text, setText] = React.useState(initial);

  function submit(q: string) {
    const v = q.trim();
    if (v) router.push(`/plan?q=${encodeURIComponent(v)}`);
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(text);
        }}
        className="flex items-center gap-2 rounded-xl border border-hairline bg-surface p-2 shadow-card focus-within:border-ink"
      >
        <Sparkles className="ml-2 h-5 w-5 shrink-0 text-accent-dark" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe your perfect trip…"
          className="min-w-0 flex-1 bg-transparent px-1 py-1.5 text-sm focus:outline-none"
        />
        <button
          type="submit"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Plan my Trip <ArrowRight className="h-4 w-4" />
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => {
              setText(ex);
              submit(ex);
            }}
            className="rounded-full border border-hairline bg-surface px-3 py-1.5 text-xs text-muted transition-colors hover:border-ink hover:text-ink"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
