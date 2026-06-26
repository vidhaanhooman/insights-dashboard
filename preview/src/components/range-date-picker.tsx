"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RangeCalendar } from "./range-calendar";

// "Today" reference for the prototype's mock window.
const NOW = "2026-06-23T12:00:00Z";
const TODAY = new Date(NOW);

const MON = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

function offsetDays(base: Date, n: number) {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

interface Preset {
  id: string;
  label: string;
  range: (() => { from: string; to: string }) | null;
}

const PRESETS: Preset[] = [
  { id: "none", label: "None", range: null },
  { id: "today", label: "Today", range: () => ({ from: iso(TODAY), to: iso(TODAY) }) },
  { id: "yesterday", label: "Yesterday", range: () => {
    const y = offsetDays(TODAY, -1);
    return { from: iso(y), to: iso(y) };
  } },
  { id: "24h", label: "Last 24 hours", range: () => ({ from: iso(offsetDays(TODAY, -1)), to: iso(TODAY) }) },
  { id: "7d", label: "Last 7 days", range: () => ({ from: iso(offsetDays(TODAY, -6)), to: iso(TODAY) }) },
  { id: "30d", label: "Last 30 days", range: () => ({ from: iso(offsetDays(TODAY, -29)), to: iso(TODAY) }) },
  { id: "this-month", label: "This month", range: () => {
    const start = new Date(Date.UTC(TODAY.getUTCFullYear(), TODAY.getUTCMonth(), 1));
    return { from: iso(start), to: iso(TODAY) };
  } },
  { id: "last-month", label: "Last month", range: () => {
    const start = new Date(Date.UTC(TODAY.getUTCFullYear(), TODAY.getUTCMonth() - 1, 1));
    const end = new Date(Date.UTC(TODAY.getUTCFullYear(), TODAY.getUTCMonth(), 0));
    return { from: iso(start), to: iso(end) };
  } },
  { id: "3m", label: "Last 3 months", range: () => {
    const start = new Date(Date.UTC(TODAY.getUTCFullYear(), TODAY.getUTCMonth() - 3, TODAY.getUTCDate()));
    return { from: iso(start), to: iso(TODAY) };
  } },
];

const fmt = (d: string) => {
  const [, m, da] = d.split("-");
  return `${Number(da)} ${MON[Number(m) - 1]}`;
};

/** Date-range picker with quick-range sidebar + calendar + Clear/Apply footer. */
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
  const [pendingFrom, setPendingFrom] = useState(from);
  const [pendingTo, setPendingTo] = useState(to);
  const [activePreset, setActivePreset] = useState<string>("none");

  function reset(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setPendingFrom(from);
      setPendingTo(to);
    }
  }

  function apply() {
    onChange(pendingFrom, pendingTo);
    setOpen(false);
  }

  function clear() {
    setPendingFrom("");
    setPendingTo("");
    setActivePreset("none");
  }

  function pickPreset(p: Preset) {
    setActivePreset(p.id);
    if (p.range) {
      const r = p.range();
      setPendingFrom(r.from);
      setPendingTo(r.to);
    } else {
      setPendingFrom("");
      setPendingTo("");
    }
  }

  return (
    <Popover open={open} onOpenChange={reset}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2 px-3">
          <CalendarDays className="size-4 text-text-muted" />
          {from && to ? `${fmt(from)} – ${fmt(to)}` : "Date"}
          <ChevronDown className="size-3.5 text-text-muted" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="!w-[560px] max-w-[95vw] overflow-hidden border-border-strong bg-[#141414] p-0">
        <div className="flex">
          {/* Sidebar */}
          <div className="flex w-[160px] shrink-0 flex-col border-r border-border bg-[#141414] py-3">
            <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Quick range
            </p>
            <ul className="flex flex-col">
              {PRESETS.map((p) => {
                const on = activePreset === p.id;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => pickPreset(p)}
                      className={`flex w-full items-center justify-between gap-2 px-4 py-1.5 text-left text-sm outline-none transition-colors focus-visible:bg-surface-2/40 ${
                        on ? "text-text" : "text-text-dim hover:text-text"
                      }`}
                    >
                      <span>{p.label}</span>
                      {on && <span className="size-1.5 shrink-0 rounded-full bg-text" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Calendar + footer */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex-1 p-3">
              <RangeCalendar
                from={pendingFrom || null}
                to={pendingTo || null}
                onChange={(f, t) => {
                  setActivePreset("none");
                  setPendingFrom(f);
                  setPendingTo(t);
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
              <Button variant="outline" size="sm" onClick={clear}>
                Clear
              </Button>
              <Button size="sm" onClick={apply}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
