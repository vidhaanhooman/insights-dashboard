"use client";

import { useMemo, useState } from "react";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const SURFACE_BG = { backgroundColor: "var(--surface)" } as const;
const CARD = "rounded-lg border border-border-strong shadow-xl shadow-black/40";

/**
 * Date + time range picker. Values are "YYYY-MM-DDTHH:mm". When
 * `startDisabled` is set the start is fixed ("Now") and only the end is
 * editable.
 */
export function DateRangePicker({
  startValue,
  endValue,
  onApply,
  startDisabled = false,
  className,
}: {
  startValue: string;
  endValue: string;
  onApply: (start: string, end: string) => void;
  startDisabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [startDraft, setStartDraft] = useState(startValue);
  const [endDraft, setEndDraft] = useState(endValue);
  const [selecting, setSelecting] = useState<"start" | "end">(
    startDisabled ? "end" : "start",
  );

  const ps = parseValue(startDraft);
  const pe = parseValue(endDraft);

  const [viewYear, setViewYear] = useState(pe.year);
  const [viewMonth, setViewMonth] = useState(pe.month);

  const reset = () => {
    setStartDraft(startValue);
    setEndDraft(endValue);
    setSelecting(startDisabled ? "end" : "start");
    const p = parseValue(startDisabled ? endValue : startValue);
    setViewYear(p.year);
    setViewMonth(p.month);
  };

  const setStartDate = (y: number, m: number, d: number) =>
    setStartDraft((v) => serialize({ ...parseValue(v), year: y, month: m, day: d }));
  const setEndDate = (y: number, m: number, d: number) =>
    setEndDraft((v) => serialize({ ...parseValue(v), year: y, month: m, day: d }));

  const onPickDay = (y: number, m: number, d: number) => {
    setViewYear(y);
    setViewMonth(m);
    const clicked = dayNum({ year: y, month: m, day: d });
    if (startDisabled) {
      setEndDate(y, m, d);
      return;
    }
    if (selecting === "start") {
      setStartDate(y, m, d);
      if (dayNum(pe) < clicked) setEndDate(y, m, d);
      setSelecting("end");
    } else if (clicked < dayNum(ps)) {
      setStartDate(y, m, d);
      setSelecting("end");
    } else {
      setEndDate(y, m, d);
      setSelecting("start");
    }
  };

  const apply = () => {
    onApply(startDraft, endDraft);
    setOpen(false);
  };

  const applyQuick = (get: () => { start: string; end: string }) => {
    const { start, end } = get();
    if (!startDisabled) setStartDraft(start);
    setEndDraft(end);
    const p = parseValue(end);
    setViewYear(p.year);
    setViewMonth(p.month);
    setSelecting(startDisabled ? "end" : "start");
    // Commit immediately so the trigger reflects the preset (e.g. "Today").
    onApply(startDisabled ? startValue : start, end);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        if (v) reset();
        setOpen(v);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-9 items-center gap-2.5 rounded-md border border-border-strong bg-surface-2 px-3 text-left text-sm outline-none transition-colors hover:border-text-muted/40 focus:border-white",
            className,
          )}
        >
          <Calendar size={13} className="shrink-0 text-text-muted" />
          <span className="truncate text-text">
            {startDisabled
              ? `Now – ${fmtShort(parseValue(endValue))}`
              : labelFor(startValue, endValue)}
          </span>
          <ChevronDown size={14} className="shrink-0 text-text-muted" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        collisionPadding={16}
        style={SURFACE_BG}
        className={cn(CARD, "w-auto max-w-[calc(100vw-2rem)] overflow-hidden p-0")}
      >
        <div className="flex">
          <div className="w-[160px] shrink-0 border-r border-border p-2">
            <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Quick range
            </div>
            {QUICK_RANGES.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => applyQuick(q.get)}
                className="w-full rounded-md px-2 py-1.5 text-left text-sm text-text-dim transition-colors hover:bg-surface-2 hover:text-text"
              >
                {q.label}
              </button>
            ))}
          </div>
          <div className="flex w-[380px] flex-col">
          <div className="flex h-11 items-center justify-between border-b border-border px-4">
            <button
              onClick={() => {
                if (viewMonth === 0) {
                  setViewMonth(11);
                  setViewYear((y) => y - 1);
                } else setViewMonth((m) => m - 1);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-surface-2 hover:text-text"
            >
              <ChevronLeft size={14} />
            </button>
            <div className="text-sm font-medium tabular-nums text-text">
              {MONTHS[viewMonth]} {viewYear}
            </div>
            <button
              onClick={() => {
                if (viewMonth === 11) {
                  setViewMonth(0);
                  setViewYear((y) => y + 1);
                } else setViewMonth((m) => m + 1);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-surface-2 hover:text-text"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="p-3">
            <div className="mb-1 grid grid-cols-7">
              {DOW.map((d) => (
                <div
                  key={d}
                  className="py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-text-muted"
                >
                  {d}
                </div>
              ))}
            </div>
            <RangeGrid
              year={viewYear}
              month={viewMonth}
              start={startDisabled ? null : ps}
              end={pe}
              onSelect={onPickDay}
            />
          </div>

          <div className="flex items-center justify-between border-t border-border px-3 py-2.5">
            <button
              type="button"
              onClick={reset}
              className="rounded-md border border-border-strong px-3 py-1.5 text-xs text-text-dim hover:text-text"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={apply}
              className="rounded-md bg-white px-4 py-1.5 text-xs font-medium text-black hover:bg-white/90"
            >
              Apply
            </button>
          </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ser(d: Date, h: number, mi: number): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(h)}:${pad(mi)}`;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

const QUICK_RANGES: { label: string; get: () => { start: string; end: string } }[] = [
  { label: "None", get: () => { const d = new Date(); return { start: ser(d, 0, 0), end: ser(d, 23, 59) }; } },
  { label: "Today", get: () => { const d = new Date(); return { start: ser(d, 0, 0), end: ser(d, 23, 59) }; } },
  { label: "Yesterday", get: () => { const d = addDays(new Date(), -1); return { start: ser(d, 0, 0), end: ser(d, 23, 59) }; } },
  { label: "Last 24 hours", get: () => { const n = new Date(); const s = new Date(n.getTime() - 24 * 3600 * 1000); return { start: ser(s, s.getHours(), s.getMinutes()), end: ser(n, n.getHours(), n.getMinutes()) }; } },
  { label: "Last 7 days", get: () => { const n = new Date(); return { start: ser(addDays(n, -6), 0, 0), end: ser(n, 23, 59) }; } },
  { label: "Last 30 days", get: () => { const n = new Date(); return { start: ser(addDays(n, -29), 0, 0), end: ser(n, 23, 59) }; } },
  { label: "This month", get: () => { const n = new Date(); return { start: ser(new Date(n.getFullYear(), n.getMonth(), 1), 0, 0), end: ser(n, 23, 59) }; } },
  { label: "Last month", get: () => { const n = new Date(); return { start: ser(new Date(n.getFullYear(), n.getMonth() - 1, 1), 0, 0), end: ser(new Date(n.getFullYear(), n.getMonth(), 0), 23, 59) }; } },
  { label: "Last 3 months", get: () => { const n = new Date(); return { start: ser(new Date(n.getFullYear(), n.getMonth() - 3, n.getDate()), 0, 0), end: ser(n, 23, 59) }; } },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MON_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const DOW = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function RangeGrid({
  year,
  month,
  start,
  end,
  onSelect,
}: {
  year: number;
  month: number;
  start: Parsed | null;
  end: Parsed;
  onSelect: (y: number, m: number, d: number) => void;
}) {
  const cells = useMemo(() => {
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();
    const arr: { y: number; m: number; d: number; dim: boolean }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      arr.push({
        y: month === 0 ? year - 1 : year,
        m: month === 0 ? 11 : month - 1,
        d: prevDays - i,
        dim: true,
      });
    }
    for (let d = 1; d <= daysInMonth; d++) arr.push({ y: year, m: month, d, dim: false });
    while (arr.length % 7 !== 0 || arr.length < 42) {
      const idx = arr.length - firstDay - daysInMonth + 1;
      arr.push({
        y: month === 11 ? year + 1 : year,
        m: month === 11 ? 0 : month + 1,
        d: idx,
        dim: true,
      });
      if (arr.length >= 42) break;
    }
    return arr;
  }, [year, month]);

  const startN = start ? dayNum(start) : null;
  const endN = dayNum(end);
  const today = new Date();

  return (
    <div className="grid grid-cols-7">
      {cells.map((c, i) => {
        const col = i % 7;
        const n = dayNum({ year: c.y, month: c.m, day: c.d });
        const isStart = startN !== null && n === startN;
        const isEnd = n === endN;
        const edge = isStart || isEnd;
        const hasRange = startN !== null && startN !== endN;
        const inBand = startN !== null && n >= startN && n <= endN;
        const inRange = startN !== null && n > startN && n < endN;
        const isToday =
          c.y === today.getFullYear() &&
          c.m === today.getMonth() &&
          c.d === today.getDate();

        const bandRoundLeft = isStart || col === 0;
        const bandRoundRight = isEnd || col === 6;

        return (
          <div
            key={i}
            className={cn(
              hasRange && inBand && "bg-surface-2",
              hasRange && inBand && bandRoundLeft && "rounded-l-md",
              hasRange && inBand && bandRoundRight && "rounded-r-md",
            )}
          >
            <button
              type="button"
              onClick={() => onSelect(c.y, c.m, c.d)}
              className={cn(
                "h-9 w-full text-sm tabular-nums transition-colors",
                edge
                  ? cn(
                      "bg-white font-medium text-black",
                      !hasRange
                        ? "rounded-md"
                        : isStart
                          ? "rounded-l-md rounded-r-none"
                          : "rounded-r-md rounded-l-none",
                    )
                  : inRange
                    ? "text-text"
                    : isToday
                      ? "rounded-md border border-border-strong text-text hover:bg-surface-2"
                      : c.dim
                        ? "rounded-md text-text-muted/40 hover:bg-surface-2/60 hover:text-text-muted"
                        : "rounded-md text-text-dim hover:bg-surface-2 hover:text-text",
              )}
            >
              {c.d}
            </button>
          </div>
        );
      })}
    </div>
  );
}

type Parsed = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};
const pad = (n: number) => String(n).padStart(2, "0");
function dayNum(p: { year: number; month: number; day: number }) {
  return p.year * 10000 + p.month * 100 + p.day;
}
function parseValue(v: string): Parsed {
  const [d, t] = (v ?? "").split("T");
  const [y, mo, da] = (d ?? "2026-01-01").split("-").map(Number);
  const [h, mi] = (t ?? "00:00").split(":").map(Number);
  return {
    year: y || 2026,
    month: (mo || 1) - 1,
    day: da || 1,
    hour: h || 0,
    minute: mi || 0,
  };
}
function serialize(p: Parsed): string {
  return `${p.year}-${pad(p.month + 1)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}
function fmtShort(p: Parsed): string {
  return `${p.day} ${MON_SHORT[p.month]}`;
}

// Trigger label: a quick-range name if the value matches one, else the date range.
function labelFor(start: string, end: string): string {
  for (const q of QUICK_RANGES) {
    if (q.label === "None") continue;
    const r = q.get();
    if (r.start === start && r.end === end) return q.label;
  }
  return `${fmtShort(parseValue(start))} – ${fmtShort(parseValue(end))}`;
}
