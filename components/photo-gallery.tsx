"use client";

import * as React from "react";
import Image from "next/image";
import { Grip, X, ChevronLeft, ChevronRight } from "lucide-react";

export function PhotoGallery({
  photos,
  title,
  headline,
}: {
  photos: string[];
  title: string;
  headline?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const list = photos.length ? photos : [FALLBACK];
  const single = list.length === 1;

  return (
    <>
      <div
        className={
          "relative grid h-[55vh] max-h-[480px] gap-2 overflow-hidden rounded-2xl " +
          (single ? "grid-cols-1" : "grid-cols-4 grid-rows-2")
        }
      >
        <button
          onClick={() => {
            setActive(0);
            setOpen(true);
          }}
          className={
            "relative cursor-pointer " +
            (single ? "col-span-1" : "col-span-2 row-span-2")
          }
        >
          <Image
            src={list[0]}
            alt={title}
            fill
            sizes={single ? "100vw" : "50vw"}
            className="object-cover transition-opacity hover:opacity-95"
            priority
          />
          {headline && (
            <>
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent" />
              <span className="pointer-events-none absolute bottom-4 left-4 text-left font-display text-xl font-semibold text-white drop-shadow sm:text-2xl">
                {headline}
              </span>
            </>
          )}
        </button>

        {!single &&
          [1, 2, 3, 4].map((i) => (
            <button
              key={i}
              onClick={() => {
                setActive(i % list.length);
                setOpen(true);
              }}
              className="relative hidden cursor-pointer sm:block"
            >
              <Image
                src={list[i % list.length]}
                alt={`${title} photo ${i + 1}`}
                fill
                sizes="25vw"
                className="object-cover transition-opacity hover:opacity-95"
              />
            </button>
          ))}

        {single ? (
          <>
            <span className="absolute left-4 top-4 rounded-md bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-dark shadow-sm">
              More photos coming soon
            </span>
            <span className="absolute bottom-4 right-4 rounded-lg border border-line bg-white/95 px-3 py-1.5 text-xs font-semibold text-ink shadow">
              1 photo available
            </span>
          </>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg border border-ink bg-white px-3.5 py-2 text-sm font-semibold text-ink shadow hover:bg-neutral-50"
          >
            <Grip className="h-4 w-4" /> Show all {list.length} photos
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[90] flex flex-col bg-black">
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <button onClick={() => setOpen(false)} aria-label="Close">
              <X className="h-6 w-6" />
            </button>
            <span className="text-sm">
              {active + 1} / {list.length}
            </span>
            <span className="w-6" />
          </div>
          <div className="relative flex flex-1 items-center justify-center px-4 pb-8">
            <button
              onClick={() =>
                setActive((a) => (a - 1 + list.length) % list.length)
              }
              className="absolute left-4 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
              aria-label="Previous"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div className="relative h-full w-full max-w-4xl">
              <Image
                src={list[active]}
                alt={`${title} photo ${active + 1}`}
                fill
                sizes="90vw"
                className="object-contain"
              />
            </div>
            <button
              onClick={() => setActive((a) => (a + 1) % list.length)}
              className="absolute right-4 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
              aria-label="Next"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const FALLBACK =
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80";
