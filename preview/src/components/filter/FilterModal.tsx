"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import {
  Check,
  Globe,
  MessageSquare,
  Megaphone,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  X,
} from "lucide-react";
import { RangeSlider } from "./RangeSlider";
import { PillGroup } from "./PillGroup";
import { OUTCOME_DOT } from "@/lib/filter/display";
import { conditionIsActive } from "@/lib/filter/filters";
import {
  END_REASONS,
  OUTCOMES,
  type Condition,
  type ConditionField,
  type FilterState,
  type NumericFilter,
} from "@/lib/filter/types";
import type { FilterAction } from "@/lib/filter/useFilters";

interface Props {
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  dispatch: React.Dispatch<FilterAction>;
}

const TYPE_CARDS: { value: string; label: string; icon: ReactNode }[] = [
  { value: "web", label: "Web", icon: <Globe className="size-5" /> },
  { value: "call", label: "Call", icon: <Phone className="size-5" /> },
  { value: "chat", label: "Chat", icon: <MessageSquare className="size-5" /> },
  { value: "broadcast", label: "Broadcast", icon: <Megaphone className="size-5" /> },
];

const DIRECTION_CARDS: { value: string; label: string; icon: ReactNode }[] = [
  { value: "inbound", label: "Inbound", icon: <PhoneIncoming className="size-5" /> },
  { value: "outbound", label: "Outbound", icon: <PhoneOutgoing className="size-5" /> },
];

export function FilterModal({ open, onClose, filters, dispatch }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const byId = useMemo(
    () => Object.fromEntries(filters.conditions.map((c) => [c.id, c])),
    [filters.conditions]
  );
  const cond = (field: ConditionField, key?: string) => byId[key ? `${field}:${key}` : field];
  const idOf = (field: ConditionField, key?: string) => (key ? `${field}:${key}` : field);
  const ensure = (field: ConditionField, key?: string) => dispatch({ type: "ADD_CONDITION", field, key });
  const setNum = (field: ConditionField, num: NumericFilter) => {
    ensure(field);
    dispatch({ type: "UPDATE_CONDITION", id: idOf(field), patch: { num } });
  };
  const toggleValue = (field: ConditionField, value: string) => {
    ensure(field);
    dispatch({ type: "TOGGLE_VALUE", id: idOf(field), value });
  };

  const activeCount = filters.conditions.filter(conditionIsActive).length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-label="Filters"
        className="relative z-10 flex max-h-[88vh] w-[calc(100vw-2rem)] max-w-[640px] flex-col overflow-hidden rounded-2xl border border-border bg-[#141414] shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold tracking-tight">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <Section title="Channel">
            <CardGrid
              items={TYPE_CARDS}
              selected={cond("channel")?.values ?? []}
              onToggle={(v) => toggleValue("channel", v)}
            />
          </Section>

          <Section title="Direction">
            <CardGrid
              items={DIRECTION_CARDS}
              selected={cond("direction")?.values ?? []}
              onToggle={(v) => toggleValue("direction", v)}
            />
          </Section>

          <Section title="Outcome">
            <PillCheckList
              options={OUTCOMES.map((o) => ({ value: o, label: o, dot: OUTCOME_DOT[o] }))}
              selected={cond("outcome")?.values ?? []}
              onToggle={(v) => toggleValue("outcome", v)}
            />
          </Section>

          <Section title="End reason">
            <PillCheckList
              options={END_REASONS.map((e) => ({ value: e, label: e }))}
              selected={cond("endReason")?.values ?? []}
              onToggle={(v) => toggleValue("endReason", v)}
            />
          </Section>

          <Section title="Call duration">
            <RangeSlider
              min={0}
              max={600}
              step={5}
              unit="s"
              value={cond("duration")?.num ?? null}
              onChange={(num) => setNum("duration", num)}
            />
          </Section>

          <Section title="Turns">
            <RangeSlider
              min={0}
              max={50}
              step={1}
              value={cond("turns")?.num ?? null}
              onChange={(num) => setNum("turns", num)}
            />
          </Section>

          <Section title="Attempt">
            <PillGroup
              value={cond("attempt")?.num ?? null}
              onChange={(num) => setNum("attempt", num ?? { op: "=", value: null, value2: null })}
            />
          </Section>
        </div>

        <footer className="flex shrink-0 items-center justify-between border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={() => dispatch({ type: "CLEAR_CONDITIONS" })}
            disabled={activeCount === 0}
            className="rounded-md px-3 py-1.5 text-sm text-text-dim underline-offset-4 transition-colors hover:text-text hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-text px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-text/90"
          >
            {activeCount > 0 ? `Apply · ${activeCount}` : "Done"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      {children}
    </section>
  );
}

function CardGrid({
  items,
  selected,
  onToggle,
}: {
  items: { value: string; label: string; icon: ReactNode }[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((it) => {
        const on = selected.includes(it.value);
        return (
          <button
            key={it.value}
            type="button"
            onClick={() => onToggle(it.value)}
            aria-pressed={on}
            className={`group flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors ${
              on
                ? "border-text bg-surface-2/40 text-text"
                : "border-border bg-transparent text-text-dim hover:border-text-dim hover:text-text"
            }`}
          >
            <span className={on ? "text-text" : "text-text-muted group-hover:text-text"}>{it.icon}</span>
            <span className="text-sm font-medium">{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function PillCheckList({
  options,
  selected,
  onToggle,
}: {
  options: { value: string; label: string; dot?: string }[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onToggle(o.value)}
            aria-pressed={on}
            className={`inline-flex items-center gap-2 rounded-full border py-1.5 pl-2 pr-3 text-xs transition-colors ${
              on
                ? "border-text bg-text/5 text-text"
                : "border-border text-text-dim hover:border-text-dim hover:text-text"
            }`}
          >
            <span
              className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
                on ? "border-text bg-text text-bg" : "border-border-strong"
              }`}
            >
              {on && <Check className="size-2.5" strokeWidth={3} />}
            </span>
            {o.dot && <span className={`size-1.5 shrink-0 rounded-full ${o.dot}`} />}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Silence unused warnings for Condition type (re-exported for type safety in callers).
export type { Condition };
