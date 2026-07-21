"use client";

import * as React from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { formatPriceCompact } from "@/lib/utils";
import type { ListingCardData } from "@/lib/queries";

const OSM_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

export function SearchMap({ listings }: { listings: ListingCardData[] }) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    const pts = listings.filter((l) => l.lat != null && l.lng != null);
    const map = new maplibregl.Map({
      container: ref.current,
      style: OSM_STYLE,
      center: pts.length ? [pts[0].lng!, pts[0].lat!] : [0, 20],
      zoom: pts.length ? 4 : 1,
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    const bounds = new maplibregl.LngLatBounds();
    for (const l of pts) {
      const el = document.createElement("div");
      el.className = "ws-pin";
      el.textContent = formatPriceCompact(l.price_per_night);
      const popup = new maplibregl.Popup({ offset: 24, closeButton: false }).setHTML(
        `<a href="/listings/${l.id}" style="display:block;min-width:160px;text-decoration:none;color:#222">
           <strong style="display:block">${l.city}, ${l.country}</strong>
           <span style="color:#6f6f6f;font-size:12px">${l.title}</span>
           <span style="display:block;margin-top:4px;font-weight:600">${formatPriceCompact(
             l.price_per_night
           )} night</span>
         </a>`
      );
      new maplibregl.Marker({ element: el })
        .setLngLat([l.lng!, l.lat!])
        .setPopup(popup)
        .addTo(map);
      bounds.extend([l.lng!, l.lat!]);
    }
    if (pts.length > 1) map.fitBounds(bounds, { padding: 60, maxZoom: 11 });

    return () => map.remove();
  }, [listings]);

  return (
    <div
      ref={ref}
      className="h-[70vh] w-full overflow-hidden rounded-lg border border-hairline"
    />
  );
}
