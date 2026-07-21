import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "yeabajvdjgwaenhjnqgk.supabase.co" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  // Baseline security headers. NOTE: a strict Content-Security-Policy is
  // intentionally omitted for now — it needs careful allowlisting for MapLibre,
  // Supabase and Unsplash and is tracked as a follow-up. HSTS only takes effect
  // over HTTPS (no-op on local http), so it's safe to send everywhere.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
