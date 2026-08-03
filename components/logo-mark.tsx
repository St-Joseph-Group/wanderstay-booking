/**
 * The Wanderstay mark: a house/location-pin silhouette with a rising sun and a
 * winding road inside. Vector artwork so it stays crisp at any size and needs
 * no network request in the header.
 *
 * Colours come from the Warm Classic theme tokens (walnut structure, vivid
 * marigold sun) rather than the navy/orange of the supplied original, so the
 * mark stays in step with the palette. The literals are fallbacks only.
 *
 * This is a redrawn version of the supplied logo. If you drop the original
 * raster file in `public/`, swap this component out at the single call site in
 * `components/logo.tsx` — see the note there.
 */
const STRUCTURE = "var(--color-brand, #4b4035)";
const INTERIOR = "var(--color-surface, #fffdf8)";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 520"
      className={className}
      role="img"
      aria-label="Wanderstay"
    >
      <defs>
        <linearGradient id="wanderstay-sun" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-sun-light, #ffc24d)" />
          <stop offset="55%" stopColor="var(--color-sun, #f79420)" />
          <stop offset="100%" stopColor="var(--color-sun-deep, #e0651b)" />
        </linearGradient>
      </defs>

      {/* Sun — sits behind the roof, which clips its lower right. */}
      <circle cx="150" cy="104" r="92" fill="url(#wanderstay-sun)" />

      {/* House-pin silhouette. Stroked rather than double-pathed so the
          interior stays a single fill that matches the page surface. */}
      <path
        d="M200 58 L62 196 C30 228 22 266 22 300 C22 378 104 456 200 514
           C296 456 378 378 378 300 C378 266 370 228 338 196 Z"
        fill={INTERIOR}
        stroke={STRUCTURE}
        strokeWidth="38"
        strokeLinejoin="round"
      />

      {/* Chimney on the right slope. */}
      <rect x="278" y="100" width="38" height="72" rx="4" fill={STRUCTURE} />

      {/* Four-pane window. */}
      <g fill={STRUCTURE}>
        <rect x="158" y="196" width="36" height="36" rx="4" />
        <rect x="206" y="196" width="36" height="36" rx="4" />
        <rect x="158" y="244" width="36" height="36" rx="4" />
        <rect x="206" y="244" width="36" height="36" rx="4" />
      </g>

      {/* Winding road sweeping up to a point on the right. */}
      <path
        d="M58 332 C140 326 226 316 332 292 C252 318 200 362 180 410
           C162 456 176 494 200 510 C130 452 74 396 58 332 Z"
        fill={STRUCTURE}
      />
    </svg>
  );
}
