"use client";

import * as React from "react";
import { pushRecentlyViewed, type RecentItem } from "@/lib/recently-viewed";

/** Records a listing into the localStorage "recently viewed" list. Renders nothing. */
export function RecordView({ item }: { item: RecentItem }) {
  React.useEffect(() => {
    pushRecentlyViewed(item);
  }, [item.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
