"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RangeCalendar } from "./range-calendar";

const MON = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const fmt = (d: string) => {
  const [, m, da] = d.split("-");
  return `${Number(da)} ${MON[Number(m) - 1]}`;
};

/** Date-range picker: a trigger button that opens the RangeCalendar in a popover. */
export function RangeDatePicker({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2 px-3">
          <CalendarDays className="size-4 text-text-muted" />
          {from && to ? `${fmt(from)} – ${fmt(to)}` : "Select dates"}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto border-border-strong p-0">
        <RangeCalendar from={from} to={to} onChange={onChange} />
      </PopoverContent>
    </Popover>
  );
}
