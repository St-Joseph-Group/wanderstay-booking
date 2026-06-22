"use client";

import * as React from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";

export type { DateRange };

export function DateRangeCalendar({
  range,
  onChange,
  disabled,
  numberOfMonths = 1,
}: {
  range: DateRange | undefined;
  onChange: (r: DateRange | undefined) => void;
  disabled?: { from: Date; to: Date }[];
  numberOfMonths?: number;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <DayPicker
      mode="range"
      selected={range}
      onSelect={onChange}
      numberOfMonths={numberOfMonths}
      disabled={[{ before: today }, ...(disabled ?? [])]}
      excludeDisabled
    />
  );
}
