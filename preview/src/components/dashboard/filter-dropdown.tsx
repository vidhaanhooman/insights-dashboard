"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronRight,
  Filter as FunnelIcon,
  Search,
  X,
} from "lucide-react";

export type FilterValue = string[] | NumberRange | NumberPick | string | null;

export interface NumberRange {
  kind: "range";
  min: number | null;
  max: number | null;
}

export interface NumberPick {
  kind: "pick";
  value: "any" | number | { ge: number };
}

export type FilterValues = Record<string, FilterValue>;

interface BaseCategory {
  id: string;
  label: string;
  icon: ReactNode;
  disabled?: (values: FilterValues) => { reason: string } | false;
}

export interface MultiSelectCategory extends BaseCategory {
  type: "multi-select";
  options: { value: string; label: string; dot?: string; count?: number }[];
  searchable?: boolean;
  placeholder?: string;
}

export interface RangeCategory extends BaseCategory {
  type: "range";
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

export interface PillCategory extends BaseCategory {
  type: "pill";
  maxExact?: number;
}

export interface TextCategory extends BaseCategory {
  type: "text";
  placeholder?: string;
}

export interface CustomCategory extends BaseCategory {
  type: "custom";
  render: (ctx: {
    value: FilterValue | undefined;
    setValue: (v: FilterValue | null) => void;
    close: () => void;
  }) => ReactNode;
  width?: number;
}

export type Category =
  | MultiSelectCategory
  | RangeCategory
  | PillCategory
  | TextCategory
  | CustomCategory;

export interface FilterSection {
  title?: string;
  items: Category[];
}

export interface QuickFilter {
  id: string;
  label: string;
  icon: ReactNode;
  values: FilterValues;
}

export interface FilterDropdownProps {
  schema: FilterSection[];
  value: FilterValues;
  onChange: (next: FilterValues) => void;
  quickFilters?: QuickFilter[];
  triggerLabel?: string;
  align?: "left" | "right";
  width?: number;
}

function isActive(v: FilterValue | undefined): boolean {
  if (v == null) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "object" && "kind" in v) {
    if (v.kind === "range") return v.min != null || v.max != null;
    if (v.kind === "pick") return v.value !== "any";
  }
  return false;
}

export function FilterDropdown({
  schema,
  value,
  onChange,
  quickFilters,
  triggerLabel = "Filter",
  align = "right",
  width = 300,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const [anchorTop, setAnchorTop] = useState(0);
  const [q, setQ] = useState("");
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = triggerRef.current?.getBoundingClientRect();
      if (!r) return;
      const top = r.bottom + 6;
      const left = align === "right" ? r.right - width : r.left;
      setPanelPos({ top, left: Math.max(8, Math.min(left, window.innerWidth - width - 8)) });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, align, width]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const query = q.trim().toLowerCase();
  const visibleSections = useMemo(() => {
    if (!query) return schema;
    return schema
      .map((s) => ({ ...s, items: s.items.filter((c) => c.label.toLowerCase().includes(query)) }))
      .filter((s) => s.items.length > 0);
  }, [schema, query]);

  const activeCount = useMemo(
    () => Object.values(value).filter(isActive).length,
    [value]
  );

  const allCats = useMemo(() => schema.flatMap((s) => s.items), [schema]);
  const activeCat = active === "__quick__" ? null : allCats.find((c) => c.id === active) ?? null;

  const setOne = (id: string, v: FilterValue | null) => onChange({ ...value, [id]: v });

  const openRowAt = (id: string, el: HTMLElement) => {
    const rootRect = rootRef.current?.getBoundingClientRect();
    const rowRect = el.getBoundingClientRect();
    if (rootRect) setAnchorTop(rowRect.top - rootRect.top);
    setActive(id);
  };

  const triggerActive = activeCount > 0;
  const popStyle: CSSProperties = panelPos
    ? { position: "fixed", top: panelPos.top, left: panelPos.left, width }
    : { position: "fixed", top: -9999, left: -9999, width };

  return (
    <div className="relative inline-block" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex h-9 items-center gap-2 rounded-md border px-3 text-sm transition-colors ${
          triggerActive
            ? "border-text bg-surface-2 text-text"
            : "border-border-strong text-text-dim hover:border-text-dim hover:text-text"
        }`}
      >
        <FunnelIcon size={14} className="text-text-muted" />
        {triggerLabel}
        {triggerActive && (
          <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded bg-text px-1 text-[10px] font-medium text-bg">
            {activeCount}
          </span>
        )}
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <>
        <div className="fixed inset-0 z-[60]" aria-hidden onClick={() => setOpen(false)} />
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Filter"
          style={popStyle}
          className="z-[70] flex max-h-[80vh] flex-col overflow-hidden rounded-lg border border-border-strong bg-surface shadow-xl shadow-black/40"
        >
          <div className="border-b border-border p-2">
            <div className="flex h-9 items-center gap-2 rounded-md border border-border-strong bg-surface-2 px-2.5">
              <Search size={13} className="shrink-0 text-text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search filters…"
                className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
              />
            </div>
          </div>

          {activeCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-text-muted">
              <span>
                <span className="font-medium text-text">{activeCount}</span> active
              </span>
              <span className="text-text-dim">·</span>
              <button
                type="button"
                onClick={() => onChange({})}
                className="text-text-dim hover:text-text"
              >
                Clear all
              </button>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto py-1 scroll-thin">
            {quickFilters && quickFilters.length > 0 && !query && (
              <>
                <MenuRow
                  label="Quick filters"
                  icon={<FunnelIcon size={15} />}
                  isActive={active === "__quick__"}
                  onClick={(e) => openRowAt("__quick__", e.currentTarget)}
                  onHover={(e) => openRowAt("__quick__", e.currentTarget)}
                />
                <div className="my-0.5 h-px bg-border" />
              </>
            )}

            {visibleSections.length === 0 && (
              <p className="px-3 py-3 text-center text-xs text-text-muted">No matching filters.</p>
            )}

            {visibleSections.map((section, si) => (
              <div key={si}>
                {si > 0 && <div className="my-0.5 h-px bg-border" />}
                {section.title && (
                  <div className="px-3 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    {section.title}
                  </div>
                )}
                {section.items.map((cat) => {
                  const on = isActive(value[cat.id]);
                  const disabledResult = cat.disabled?.(value);
                  const isDisabled = !!disabledResult;
                  const isOpen = active === cat.id;
                  return (
                    <MenuRow
                      key={cat.id}
                      label={cat.label}
                      icon={cat.icon}
                      hasDot={on}
                      disabled={isDisabled}
                      disabledReason={disabledResult ? disabledResult.reason : undefined}
                      isActive={isOpen}
                      onClick={(e) => !isDisabled && openRowAt(cat.id, e.currentTarget)}
                      onHover={(e) => !isDisabled && openRowAt(cat.id, e.currentTarget)}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {active === "__quick__" && quickFilters && (
            <Flyout width={320} anchorTop={anchorTop}>
              <div className="flex flex-col p-1">
                {quickFilters.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      onChange(q.values);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-md px-2.5 py-1.5 text-left text-sm text-text-dim transition-colors hover:bg-surface-2/60 hover:text-text"
                  >
                    <span className="shrink-0 text-text-muted">{q.icon}</span>
                    <span className="flex-1 truncate">{q.label}</span>
                  </button>
                ))}
              </div>
            </Flyout>
          )}

          {activeCat && (
            <Flyout
              width={activeCat.type === "custom" ? activeCat.width ?? 320 : 320}
              anchorTop={anchorTop}
              title={activeCat.label}
              icon={activeCat.icon}
            >
              <EditorForCategory
                cat={activeCat}
                value={value[activeCat.id]}
                onChange={(v) => setOne(activeCat.id, v)}
                close={() => setActive(null)}
              />
            </Flyout>
          )}
        </div>
        </>,
        document.body
      )}
    </div>
  );
}

export function FilterPanel({
  schema,
  value,
  onChange,
  quickFilters,
  onClose,
  className,
}: {
  schema: FilterSection[];
  value: FilterValues;
  onChange: (next: FilterValues) => void;
  quickFilters?: QuickFilter[];
  onClose?: () => void;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const [anchorTop, setAnchorTop] = useState(0);
  const [q, setQ] = useState("");

  const query = q.trim().toLowerCase();
  const visibleSections = useMemo(() => {
    if (!query) return schema;
    return schema
      .map((s) => ({ ...s, items: s.items.filter((c) => c.label.toLowerCase().includes(query)) }))
      .filter((s) => s.items.length > 0);
  }, [schema, query]);

  const activeCount = useMemo(() => Object.values(value).filter(isActive).length, [value]);
  const allCats = useMemo(() => schema.flatMap((s) => s.items), [schema]);
  const activeCat = active === "__quick__" ? null : allCats.find((c) => c.id === active) ?? null;

  const setOne = (id: string, v: FilterValue | null) => onChange({ ...value, [id]: v });

  const openRowAt = (id: string, el: HTMLElement) => {
    const rootRect = rootRef.current?.getBoundingClientRect();
    const rowRect = el.getBoundingClientRect();
    if (rootRect) setAnchorTop(rowRect.top - rootRect.top);
    setActive(id);
  };

  return (
    <div
      ref={rootRef}
      className={`relative flex h-full min-h-0 flex-col rounded-lg border border-border-strong bg-surface ${className ?? ""}`}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close filters"
          className="absolute right-2 top-2 z-10 rounded-md p-1 text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
        >
          <X size={14} />
        </button>
      )}

      <div className="border-b border-border p-2">
        <div className="flex h-9 items-center gap-2 rounded-md border border-border-strong bg-surface-2 px-2.5">
          <Search size={13} className="shrink-0 text-text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search filters…"
            className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
          />
        </div>
      </div>

      {activeCount > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-text-muted">
          <span>
            <span className="font-medium text-text">{activeCount}</span> active
          </span>
          <span className="text-text-dim">·</span>
          <button type="button" onClick={() => onChange({})} className="text-text-dim hover:text-text">
            Clear all
          </button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto py-1 scroll-thin">
        {quickFilters && quickFilters.length > 0 && !query && (
          <>
            <MenuRow
              label="Quick filters"
              icon={<FunnelIcon size={15} />}
              isActive={active === "__quick__"}
              onClick={(e) => openRowAt("__quick__", e.currentTarget)}
              onHover={(e) => openRowAt("__quick__", e.currentTarget)}
            />
            <div className="my-0.5 h-px bg-border" />
          </>
        )}

        {visibleSections.length === 0 && (
          <p className="px-3 py-3 text-center text-xs text-text-muted">No matching filters.</p>
        )}

        {visibleSections.map((section, si) => (
          <div key={si}>
            {si > 0 && <div className="my-0.5 h-px bg-border" />}
            {section.title && (
              <div className="px-3 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                {section.title}
              </div>
            )}
            {section.items.map((cat) => {
              const on = isActive(value[cat.id]);
              const disabledResult = cat.disabled?.(value);
              const isDisabled = !!disabledResult;
              const isOpen = active === cat.id;
              return (
                <MenuRow
                  key={cat.id}
                  label={cat.label}
                  icon={cat.icon}
                  hasDot={on}
                  disabled={isDisabled}
                  disabledReason={disabledResult ? disabledResult.reason : undefined}
                  isActive={isOpen}
                  onClick={(e) => !isDisabled && openRowAt(cat.id, e.currentTarget)}
                  onHover={(e) => !isDisabled && openRowAt(cat.id, e.currentTarget)}
                />
              );
            })}
          </div>
        ))}
      </div>

      {active === "__quick__" && quickFilters && (
        <Flyout width={300} anchorTop={anchorTop}>
          <div className="flex flex-col p-1">
            {quickFilters.map((qf) => (
              <button
                key={qf.id}
                type="button"
                onClick={() => {
                  onChange(qf.values);
                  setActive(null);
                }}
                className="flex w-full items-center gap-3 rounded-md px-2.5 py-1.5 text-left text-sm text-text-dim transition-colors hover:bg-surface-2/60 hover:text-text"
              >
                <span className="shrink-0 text-text-muted">{qf.icon}</span>
                <span className="flex-1 truncate">{qf.label}</span>
              </button>
            ))}
          </div>
        </Flyout>
      )}

      {activeCat && (
        <Flyout
          width={activeCat.type === "custom" ? activeCat.width ?? 300 : 300}
          anchorTop={anchorTop}
          title={activeCat.label}
          icon={activeCat.icon}
        >
          <EditorForCategory
            cat={activeCat}
            value={value[activeCat.id]}
            onChange={(v) => setOne(activeCat.id, v)}
            close={() => setActive(null)}
          />
        </Flyout>
      )}
    </div>
  );
}

function MenuRow({
  label,
  icon,
  hasDot,
  disabled,
  disabledReason,
  isActive,
  onClick,
  onHover,
}: {
  label: string;
  icon: ReactNode;
  hasDot?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  isActive?: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onHover: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={disabledReason}
      onClick={onClick}
      onMouseEnter={onHover}
      className={`flex w-full items-center gap-3 px-3 py-1.5 text-left text-sm transition-colors ${
        disabled
          ? "cursor-not-allowed text-text-muted/50"
          : isActive
            ? "bg-surface-2 text-text"
            : "text-text-dim hover:bg-surface-2/60 hover:text-text"
      }`}
    >
      <span className={`shrink-0 ${disabled ? "text-text-muted/50" : "text-text-muted"}`}>{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {hasDot && !disabled && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />}
      <ChevronRight size={14} className={`shrink-0 ${disabled ? "text-text-muted/50" : "text-text-muted"}`} />
    </button>
  );
}

function Flyout({
  width,
  anchorTop,
  title,
  icon,
  children,
}: {
  width: number;
  anchorTop: number;
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      style={{ width, top: anchorTop }}
      className="absolute right-full mr-2 overflow-hidden rounded-lg border border-border-strong bg-surface p-3 shadow-xl shadow-black/40"
    >
      {title && (
        <div className="mb-2.5 flex items-center gap-2 text-sm font-medium text-text">
          <span className="text-text-muted">{icon}</span>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

function EditorForCategory({
  cat,
  value,
  onChange,
  close,
}: {
  cat: Category;
  value: FilterValue | undefined;
  onChange: (v: FilterValue | null) => void;
  close: () => void;
}) {
  switch (cat.type) {
    case "multi-select":
      return <MultiSelectEditor cat={cat} value={(value as string[]) ?? []} onChange={onChange} />;
    case "range":
      return (
        <RangeEditor
          cat={cat}
          value={(value as NumberRange) ?? { kind: "range", min: null, max: null }}
          onChange={onChange}
        />
      );
    case "pill":
      return (
        <PillEditor
          cat={cat}
          value={(value as NumberPick) ?? { kind: "pick", value: "any" }}
          onChange={onChange}
        />
      );
    case "text":
      return <TextEditor cat={cat} value={(value as string) ?? ""} onChange={onChange} />;
    case "custom":
      return <>{cat.render({ value, setValue: onChange, close })}</>;
  }
}

function MultiSelectEditor({
  cat,
  value,
  onChange,
}: {
  cat: MultiSelectCategory;
  value: string[];
  onChange: (v: string[] | null) => void;
}) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const list = useMemo(
    () => cat.options.filter((o) => o.label.toLowerCase().includes(query)),
    [cat.options, query]
  );
  const toggle = (v: string) => {
    const next = value.includes(v) ? value.filter((x) => x !== v) : [...value, v];
    onChange(next.length ? next : null);
  };

  return (
    <div className="space-y-2">
      {(cat.searchable ?? cat.options.length > 6) && (
        <div className="flex h-9 items-center gap-2 rounded-md border border-border-strong bg-surface-2 px-2.5">
          <Search size={13} className="shrink-0 text-text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={cat.placeholder ?? "Search…"}
            className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
          />
        </div>
      )}
      <ul className="max-h-56 overflow-y-auto pr-1 scroll-thin">
        {list.map((o) => {
          const on = value.includes(o.value);
          return (
            <li key={o.value}>
              <button
                type="button"
                onClick={() => toggle(o.value)}
                className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors ${
                  on ? "bg-surface-2" : "hover:bg-surface-2/60"
                }`}
              >
                <CheckBox checked={on} />
                {o.dot && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${o.dot}`} />}
                <span className={`flex-1 truncate text-sm ${on ? "text-text" : "text-text-dim"}`}>{o.label}</span>
                {o.count != null && (
                  <span className="shrink-0 tabular-nums text-xs text-text-muted">{o.count}</span>
                )}
              </button>
            </li>
          );
        })}
        {list.length === 0 && <li className="px-3 py-4 text-center text-xs text-text-muted">No matches.</li>}
      </ul>
    </div>
  );
}

function RangeEditor({
  cat,
  value,
  onChange,
}: {
  cat: RangeCategory;
  value: NumberRange;
  onChange: (v: NumberRange | null) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<"lo" | "hi" | null>(null);
  const step = cat.step ?? 1;
  const lo = value.min ?? cat.min;
  const hi = value.max ?? cat.max;
  const span = cat.max - cat.min || 1;
  const pct = (v: number) => ((v - cat.min) / span) * 100;

  const emit = (nextLo: number, nextHi: number) => {
    const a = Math.min(Math.max(nextLo, cat.min), nextHi);
    const b = Math.max(Math.min(nextHi, cat.max), nextLo);
    const min = a <= cat.min ? null : Math.round(a);
    const max = b >= cat.max ? null : Math.round(b);
    if (min == null && max == null) onChange(null);
    else onChange({ kind: "range", min, max });
  };

  const valFromX = (clientX: number) => {
    const r = trackRef.current?.getBoundingClientRect();
    if (!r) return cat.min;
    const ratio = Math.min(Math.max((clientX - r.left) / r.width, 0), 1);
    return Math.round((cat.min + ratio * span) / step) * step;
  };

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const v = valFromX(e.clientX);
      if (drag === "lo") emit(v, hi);
      else emit(lo, v);
    };
    const up = () => setDrag(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag, lo, hi]);

  return (
    <div className="space-y-2.5">
      <div
        ref={trackRef}
        className="relative mx-2 h-5 cursor-pointer select-none"
        onPointerDown={(e) => {
          const v = valFromX(e.clientX);
          const which = Math.abs(v - lo) <= Math.abs(v - hi) ? "lo" : "hi";
          if (which === "lo") emit(v, hi);
          else emit(lo, v);
          setDrag(which);
        }}
      >
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-border-strong" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-white"
          style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
        />
        {(["lo", "hi"] as const).map((which) => {
          const v = which === "lo" ? lo : hi;
          return (
            <button
              key={which}
              type="button"
              aria-label={which === "lo" ? "Minimum" : "Maximum"}
              onPointerDown={(e) => {
                e.stopPropagation();
                (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                setDrag(which);
              }}
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-neutral-900 shadow-md shadow-black/40 hover:scale-110"
              style={{ left: `${pct(v)}%` }}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-2">
        <NumBox
          value={value.min}
          placeholder={String(cat.min)}
          unit={cat.unit}
          onChange={(n) => emit(n ?? cat.min, hi)}
        />
        <span className="shrink-0 text-text-muted">—</span>
        <NumBox
          value={value.max}
          placeholder={String(cat.max)}
          unit={cat.unit}
          onChange={(n) => emit(lo, n ?? cat.max)}
        />
      </div>
    </div>
  );
}

function NumBox({
  value,
  placeholder,
  unit,
  onChange,
}: {
  value: number | null;
  placeholder: string;
  unit?: string;
  onChange: (n: number | null) => void;
}) {
  return (
    <div className="flex h-8 min-w-0 flex-1 items-center gap-1 rounded-md border border-border-strong bg-surface-2 px-2 focus-within:border-white">
      <input
        type="number"
        inputMode="numeric"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className="min-w-0 flex-1 bg-transparent text-center text-sm text-text outline-none placeholder:text-text-dim"
      />
      {unit && <span className="shrink-0 text-[10px] uppercase tracking-wide text-text-muted">{unit}</span>}
    </div>
  );
}

function PillEditor({
  cat,
  value,
  onChange,
}: {
  cat: PillCategory;
  value: NumberPick;
  onChange: (v: NumberPick | null) => void;
}) {
  const maxExact = cat.maxExact ?? 4;
  const plusValue = maxExact + 1;
  const pick = (v: NumberPick["value"]) => {
    if (v === "any") onChange(null);
    else onChange({ kind: "pick", value: v });
  };
  const pills: { key: string; label: string; v: NumberPick["value"]; on: boolean }[] = [
    { key: "any", label: "Any", v: "any", on: value.value === "any" },
    ...Array.from({ length: maxExact }, (_, i) => i + 1).map((n) => ({
      key: String(n),
      label: String(n),
      v: n,
      on: value.value === n,
    })),
    {
      key: "plus",
      label: `${plusValue}+`,
      v: { ge: plusValue } as const,
      on: typeof value.value === "object" && "ge" in value.value && value.value.ge === plusValue,
    },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {pills.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => pick(p.v)}
          aria-pressed={p.on}
          className={`h-9 min-w-9 rounded-lg border px-3.5 text-sm transition-colors ${
            p.on
              ? "border-text bg-text text-bg"
              : "border-border-strong bg-surface text-text-dim hover:border-text-dim hover:text-text"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function TextEditor({
  cat,
  value,
  onChange,
}: {
  cat: TextCategory;
  value: string;
  onChange: (v: string | null) => void;
}) {
  return (
    <input
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value || null)}
      placeholder={cat.placeholder ?? "contains…"}
      className="h-9 w-full rounded-md border border-border-strong bg-surface-2 px-3 text-sm text-text outline-none placeholder:text-text-muted focus:border-white"
    />
  );
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
        checked ? "border-white bg-white text-black" : "border-border-strong"
      }`}
    >
      {checked && <Check size={11} strokeWidth={3} />}
    </span>
  );
}
