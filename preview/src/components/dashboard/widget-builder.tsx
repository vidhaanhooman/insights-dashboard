"use client"

import * as React from "react"
import { Check, ChevronDown, ChevronLeft, ChevronRight, Plus, Search, Trash2, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Field, FieldLabel as UIFieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { RANGE_LABEL } from "@/lib/insights/mock-data"
import { SYSTEM_METRICS, VIZ, SPAN_FOR_TYPE, SCALAR_TYPES } from "@/lib/insights/registry"
import { WidgetRenderer } from "@/components/dashboard/widgets/widget-renderer"
import type {
  GroupField,
  Metric,
  TimeRange,
  ViewByGranularity,
  Widget,
  WidgetType,
} from "@/lib/insights/types"
import { cn } from "@/lib/utils"
import { Filter as FunnelIcon } from "lucide-react"
import { FilterMenu } from "@/components/filter/FilterMenu"
import { filterReducer, type FilterAction } from "@/lib/filter/useFilters"
import { conditionIsActive, conditionLabel } from "@/lib/filter/filters"
import { INITIAL_FILTERS, type Condition, type FilterState } from "@/lib/filter/types"

const OWNER_ID = "you"
const DATA_SOURCES = ["Conversations", "Tasks", "Executions", "Metric Runs"]
const AGG_TYPES = ["Sum", "Average", "Count", "Min", "Max", "Unique count"]
const GROUP_BY = [
  "None",
  "time",
  "outcome",
  "callInfo.endReason",
  "agent",
  "callInfo.from",
  "callInfo.to",
  "callInfo.attempt",
]
const DIMENSIONS = GROUP_BY.filter((g) => g !== "None")
const VIEW_BY = ["Hour", "Day", "Month"]
const VIZ_HELP: Record<WidgetType, string> = {
  number: "A single KPI for quick scanning.",
  line: "A trend over time for volume, rate, or duration.",
  bar: "A ranked comparison across agents, outcomes, or numbers.",
  pie: "A part-to-whole breakdown for outcomes or categories.",
  table: "A detailed view with rows and columns.",
  heatmap: "A dense time pattern for activity by hour or day.",
}
const GROUP_LABELS: Record<string, string> = {
  None: "None",
  time: "Time",
  outcome: "Outcome",
  "callInfo.endReason": "End reason",
  agent: "Agent",
  "callInfo.from": "From number",
  "callInfo.to": "To number",
  "callInfo.attempt": "Attempt",
}
const METRIC_DESC: Record<string, string> = {
  calls: "Total outbound + inbound calls dialed in the selected window.",
  connected: "Calls where the callee picked up and audio was exchanged.",
  pickup: "Share of attempted calls that connected (connected ÷ calls).",
  avgdur: "Mean conversation length across connected calls.",
  turns: "Total back-and-forth turns across all conversations.",
  init_fail: "Calls that failed before the agent could engage.",
  stt_cost: "Speech-to-text spend across processed audio.",
  fail_rate: "Share of attempted calls that ended in failure.",
  convs: "Distinct conversations recorded in the window.",
  llm_cost: "Model inference spend across all conversations.",
  avg_resp_len: "Mean agent response length in tokens.",
  unique_callers: "Distinct phone numbers that dialed in.",
  voicemail_count: "Calls that ended by leaving a voicemail.",
  voicemail_rate: "Share of calls that ended in voicemail.",
  agent_interrupts: "How often the agent talked over the user.",
}

const VALUE_SLOT_LABEL: Record<WidgetType, string> = {
  number: "Measure",
  line: "Y measure",
  bar: "Bar measure",
  pie: "Slice measure",
  table: "Measures",
  heatmap: "Color measure",
}

type WidgetPatch = Pick<
  Widget,
  | "type"
  | "title"
  | "span"
  | "config"
  | "metricIds"
  | "dataSource"
  | "timeRange"
  | "persistTimeRange"
>

let _uid = 0
const uid = (p: string) => `${p}${++_uid}`

interface MetricBlock {
  id: string
  metricId: string
  agg: string
  name: string
  open: boolean
  filters: FilterState
}

export interface BuilderTarget {
  widget: Widget
  metric?: Metric
}

function freshFilterState(): FilterState {
  return { ...INITIAL_FILTERS, conditions: [] }
}

function newMetricBlock(metricId = ""): MetricBlock {
  return { id: uid("m"), metricId, agg: "Sum", name: "", open: true, filters: freshFilterState() }
}

function initialBlocks(editing?: BuilderTarget | null): MetricBlock[] {
  if (!editing) return [newMetricBlock()]
  const src = editing.metric?.source
  const base =
    src?.kind === "filtered" ? src.baseKey : editing.widget.metricIds[0]
  let filters: FilterState = freshFilterState()
  if (src?.kind === "filtered") {
    const grouped: Record<string, string[]> = {}
    for (const w of src.where) (grouped[w.field] ??= []).push(w.value)
    filters = {
      ...freshFilterState(),
      conditions: Object.entries(grouped).map(([field, values]) => ({
        id: field,
        field: field as Condition["field"],
        values,
      })),
    }
  }
  return [
    { id: uid("m"), metricId: base ?? "", agg: "Sum", name: "", open: true, filters },
  ]
}

function usableFilters(block: MetricBlock): { field: GroupField; value: string }[] {
  const out: { field: GroupField; value: string }[] = []
  for (const c of block.filters.conditions) {
    if (!conditionIsActive(c)) continue
    if (c.field === "outcome" && c.values) {
      for (const v of c.values) out.push({ field: "outcome", value: v })
    } else if (c.field === "agent" && c.agents) {
      for (const a of Object.keys(c.agents)) out.push({ field: "agent", value: a })
    }
  }
  return out
}

export function WidgetBuilder({
  open,
  onOpenChange,
  onAdd,
  onUpdate,
  editing,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (widget: Widget, extraMetric: Metric | null) => void
  onUpdate?: (id: string, patch: WidgetPatch, extraMetric: Metric | null) => void
  editing?: BuilderTarget | null
}) {
  const isEditing = !!editing
  const [filterOpen, setFilterOpen] = React.useState(false)
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      {open && (
        <div
          aria-hidden
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-md"
          onClick={() => onOpenChange(false)}
        />
      )}
      <DialogContent
        className={cn(
          "flex h-[92vh] max-h-[92vh] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden bg-[#141414] p-0 sm:max-w-[calc(100vw-2rem)]",
          "data-open:!animate-none data-closed:!animate-none [--tw-enter-scale:1]",
          isEditing
            ? "xl:w-[1180px] xl:max-w-[1180px]"
            : filterOpen
              ? "xl:w-[1080px] xl:max-w-[1080px]"
              : "xl:w-[780px] xl:max-w-[780px]"
        )}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <div className="flex h-full min-h-0 flex-1">
          {isEditing && editing && (
            <div className="hidden flex-1 flex-col border-r border-border bg-[#0c0c0c] p-6 xl:flex">
              <p className="mb-3 text-[11px] font-medium text-text-muted">Preview</p>
              <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border bg-[#141414] p-3">
                <WidgetRenderer
                  widget={editing.widget}
                  metricsById={Object.fromEntries(SYSTEM_METRICS.map((m) => [m.id, m]))}
                  range="7d"
                  refreshKey={0}
                  ctl={{}}
                />
              </div>
            </div>
          )}
          <div className={cn("flex h-full min-w-0 flex-1 flex-col", isEditing && "xl:w-[680px] xl:flex-none xl:shrink-0")}>
            <BuilderForm
              key={editing?.widget.id ?? "new"}
              editing={editing}
              onAdd={onAdd}
              onUpdate={onUpdate}
              onClose={() => onOpenChange(false)}
              onFilterPanelChange={setFilterOpen}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] font-semibold text-text">{children}</p>
  )
}

function SectionShell({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        "space-y-2.5 rounded-lg border border-border bg-transparent p-3.5",
        className
      )}
    >
      <SectionLabel>{title}</SectionLabel>
      {children}
    </section>
  )
}

function RequiredMark() {
  return <span className="text-text-muted" aria-hidden="true">*</span>
}

function FieldLabel({
  children,
  required = false,
}: {
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <Label className="text-xs font-normal text-text-muted">
      {children} {required && <RequiredMark />}
    </Label>
  )
}

function ToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-[#141414] px-2.5 py-1.5">
      <Label className="text-xs font-normal">{title}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

function SlotSelect({
  label,
  value,
  options,
  onChange,
  required = false,
  helper,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
  required?: boolean
  helper?: string
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel required={required}>{label}</FieldLabel>
      <ChoiceCombobox
        options={options.map((option) => ({
          value: option,
          label: GROUP_LABELS[option],
        }))}
        value={value}
        onValueChange={onChange}
        placeholder={`Select ${label.toLowerCase()}`}
      />
      {helper && <p className="text-xs text-text-muted">{helper}</p>}
    </div>
  )
}

function ChoiceCombobox({
  options,
  value,
  onValueChange,
  placeholder,
}: {
  options: { value: string; label: string }[]
  value: string
  onValueChange: (value: string) => void
  placeholder: string
}) {
  const labels = options.map((option) => option.label)
  const selected = options.find((option) => option.value === value)

  return (
    <Combobox
      items={labels}
      value={selected?.label}
      onValueChange={(label) => {
        const option = options.find((item) => item.label === label)
        if (option) onValueChange(option.value)
      }}
    >
      <ComboboxInput className="h-9 rounded-lg text-sm" placeholder={placeholder} />
      <ComboboxContent>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

function MetricPicker({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  const labels = SYSTEM_METRICS.map((m) => m.label)
  const selected = SYSTEM_METRICS.find((m) => m.id === value)
  return (
    <Combobox
      items={labels}
      value={selected?.label}
      onValueChange={(label) => {
        const m = SYSTEM_METRICS.find((metric) => metric.label === label)
        if (m) onChange(m.id)
      }}
    >
      <ComboboxInput placeholder={placeholder} className="!bg-[#141414]" />
      <ComboboxContent>
        <ComboboxEmpty>No metrics found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => {
            const metric = SYSTEM_METRICS.find((m) => m.label === item)
            const desc = metric ? METRIC_DESC[metric.id] : undefined
            return (
              <ComboboxItem key={item} value={item}>
                <span className="flex flex-col gap-0.5">
                  <span className="whitespace-nowrap text-sm text-text">{item}</span>
                  {desc && (
                    <span className="text-xs leading-snug text-text-muted">{desc}</span>
                  )}
                </span>
              </ComboboxItem>
            )
          }}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

function GroupByMultiPicker({
  value,
  onChange,
}: {
  value: string[]
  onChange: (next: string[]) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [q, setQ] = React.useState("")
  const query = q.trim().toLowerCase()
  const options = GROUP_BY.filter((g) => g !== "None")
  const filtered = options.filter((g) => (GROUP_LABELS[g] ?? g).toLowerCase().includes(query))
  const triggerLabel = value.length === 0
    ? "Select dimensions"
    : value.map((g) => GROUP_LABELS[g] ?? g).join(", ")
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-9 flex-1 items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-3 text-left text-sm shadow-xs transition-colors hover:border-ring focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <span className={cn("truncate", value.length === 0 && "text-muted-foreground")}>
            {triggerLabel}
          </span>
          <ChevronDown className="size-3.5 shrink-0 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-[260px] p-0">
        <div className="border-b border-border p-2">
          <div className="flex h-8 items-center gap-2 rounded-md border border-border bg-surface-2/40 px-2.5">
            <Search className="size-3.5 shrink-0 text-text-muted" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search dimensions…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-text-muted"
            />
          </div>
        </div>
        <ul className="max-h-64 overflow-y-auto p-1">
          {filtered.length === 0 && (
            <li className="px-3 py-4 text-center text-xs text-text-muted">No matches.</li>
          )}
          {filtered.map((g) => {
            const on = value.includes(g)
            return (
              <li key={g}>
                <button
                  type="button"
                  onClick={() =>
                    onChange(on ? value.filter((x) => x !== g) : [...value, g])
                  }
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors",
                    on ? "bg-surface-2/60" : "hover:bg-surface-2/40"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded border",
                      on ? "border-foreground bg-foreground text-background" : "border-border"
                    )}
                  >
                    {on && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  <span className="text-sm">{GROUP_LABELS[g] ?? g}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

function ShapeNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-border bg-[#141414] px-3 py-2 text-xs leading-5 text-text-muted">
      {children}
    </p>
  )
}

function BuilderForm({
  editing,
  onAdd,
  onUpdate,
  onClose,
  onFilterPanelChange,
}: {
  editing?: BuilderTarget | null
  onAdd: (widget: Widget, extraMetric: Metric | null) => void
  onUpdate?: (id: string, patch: WidgetPatch, extraMetric: Metric | null) => void
  onClose: () => void
  onFilterPanelChange?: (open: boolean) => void
}) {
  const isEdit = !!editing
  // Metric (number) widgets get a focused, per-metric edit view — no chart chrome.
  const metricMode = editing?.widget.type === "number"
  const [viz, setViz] = React.useState<WidgetType>(editing?.widget.type ?? "number")
  const [title, setTitle] = React.useState(editing?.widget.title ?? "")
  const [dataSource, setDataSource] = React.useState(
    editing?.widget.dataSource ?? "Conversations"
  )
  const [timeRange, setTimeRange] = React.useState<TimeRange>(
    editing?.widget.timeRange ?? "today"
  )
  const [persist, setPersist] = React.useState(
    editing?.widget.persistTimeRange ?? false
  )
  const [lineXAxis, setLineXAxis] = React.useState(
    editing?.widget.config.xAxis ?? "time"
  )
  const [lineSplitBy, setLineSplitBy] = React.useState(
    editing?.widget.config.groupBy ?? "None"
  )
  const [barCategoryAxis, setBarCategoryAxis] = React.useState(
    editing?.widget.config.categoryAxis ?? editing?.widget.config.groupBy ?? "agent"
  )
  const [barStackBy, setBarStackBy] = React.useState(
    editing?.widget.config.stackBy ?? "None"
  )
  const [pieSliceBy, setPieSliceBy] = React.useState(
    editing?.widget.config.sliceBy ?? editing?.widget.config.groupBy ?? "outcome"
  )
  const [tableRowsBy, setTableRowsBy] = React.useState(
    editing?.widget.config.rowsBy ?? editing?.widget.config.groupBy ?? "agent"
  )
  const [tableColumnsBy, setTableColumnsBy] = React.useState(
    editing?.widget.config.columnsBy ?? "None"
  )
  const [heatmapXAxis, setHeatmapXAxis] = React.useState(
    editing?.widget.config.xAxis ?? "time"
  )
  const [heatmapYAxis, setHeatmapYAxis] = React.useState(
    editing?.widget.config.yAxis ?? "agent"
  )
  const [viewBy, setViewBy] = React.useState<ViewByGranularity>(
    editing?.widget.config.viewBy ?? "Hour"
  )
  const [donut, setDonut] = React.useState(editing?.widget.config.donut ?? true)
  const [percentages, setPercentages] = React.useState(
    editing?.widget.config.percentages ?? true
  )
  const [showLegend, setShowLegend] = React.useState(
    editing?.widget.config.showLegend ?? true
  )
  const [numberPrefix, setNumberPrefix] = React.useState(
    editing?.widget.config.numberPrefix ?? ""
  )
  const [numberSuffix, setNumberSuffix] = React.useState(
    editing?.widget.config.numberSuffix ?? ""
  )
  const [numberDecimals, setNumberDecimals] = React.useState<number>(
    editing?.widget.config.numberDecimals ?? 0
  )
  const [numberUnit, setNumberUnit] = React.useState<string>("none")
  const [numberUnitPosition, setNumberUnitPosition] = React.useState<"left" | "right">("right")
  const [showDataLabels, setShowDataLabels] = React.useState(
    editing?.widget.config.showDataLabels ?? false
  )
  const [pieShowLabels, setPieShowLabels] = React.useState(true)
  const [pieSort, setPieSort] = React.useState<"value-desc" | "value-asc" | "alpha">("value-desc")
  const [pieGroupSmall, setPieGroupSmall] = React.useState<"off" | "5" | "10">("off")
  const [piePalette, setPiePalette] = React.useState<"default" | "warm" | "cool" | "categorical">("default")
  const [editVizOpen, setEditVizOpen] = React.useState(false)
  const [widgetGroupBy, setWidgetGroupBy] = React.useState<string>(
    editing?.widget.config.groupBy ?? "None"
  )
  const [widgetGroupByList, setWidgetGroupByList] = React.useState<string[]>(() => {
    const g = editing?.widget.config.groupBy
    return g && g !== "None" ? [g] : []
  })
  const [metrics, setMetrics] = React.useState<MetricBlock[]>(() =>
    initialBlocks(editing)
  )
  const [titleTouched, setTitleTouched] = React.useState(!!editing?.widget.title)
  const [filterPanelFor, setFilterPanelFor] = React.useState<string | null>(null)
  React.useEffect(() => {
    onFilterPanelChange?.(filterPanelFor !== null)
  }, [filterPanelFor, onFilterPanelChange])
  const [filterCollapsed, setFilterCollapsed] = React.useState(false)

  const titleValid = title.trim().length >= 2
  const filledMetrics = metrics.filter((m) => m.metricId)
  const hasMetric = filledMetrics.length > 0
  const supportsMultipleMetrics = viz === "line" || viz === "bar" || viz === "table"
  const metricShapeValid = hasMetric && (supportsMultipleMetrics || filledMetrics.length === 1)
  const primaryMetric = metrics.find((m) => m.metricId) ?? metrics[0]
  const selectedMetric = SYSTEM_METRICS.find((m) => m.id === primaryMetric?.metricId)
  const metricLabels = filledMetrics
    .map((m) => SYSTEM_METRICS.find((metric) => metric.id === m.metricId)?.label)
    .filter(Boolean) as string[]
  const metricLabel = metricLabels.length ? metricLabels.join(", ") : selectedMetric?.label ?? ""
  const vizLabel = VIZ.find((v) => v.type === viz)?.label ?? "Widget"
  const activeShapeLabel =
    viz === "number"
      ? "Single value"
      : viz === "line"
        ? `X: ${GROUP_LABELS[lineXAxis]}${lineSplitBy !== "None" ? `, split by ${GROUP_LABELS[lineSplitBy]}` : ""}`
        : viz === "bar"
          ? `Category: ${GROUP_LABELS[barCategoryAxis]}${barStackBy !== "None" ? `, stack by ${GROUP_LABELS[barStackBy]}` : ""}`
          : viz === "pie"
            ? `Slices: ${GROUP_LABELS[pieSliceBy]}`
            : viz === "table"
              ? `Rows: ${GROUP_LABELS[tableRowsBy]}${tableColumnsBy !== "None" ? `, columns: ${GROUP_LABELS[tableColumnsBy]}` : ""}`
              : `X: ${GROUP_LABELS[heatmapXAxis]}, Y: ${GROUP_LABELS[heatmapYAxis]}`
  const primaryDimension =
    viz === "line"
      ? lineXAxis
      : viz === "bar"
        ? barCategoryAxis
        : viz === "pie"
          ? pieSliceBy
          : viz === "table"
            ? tableRowsBy
            : viz === "heatmap"
              ? heatmapYAxis
              : "None"
  const suggestedTitle = React.useMemo(() => {
    if (!metricLabel) return ""
    if (!SCALAR_TYPES.includes(viz) && primaryDimension !== "None") {
      return `${metricLabel} by ${GROUP_LABELS[primaryDimension].toLowerCase()}`
    }
    if (viz === "line") return `${metricLabel} trend`
    return metricLabel
  }, [metricLabel, primaryDimension, viz])
  const duplicateNames = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const m of metrics) {
      const key = m.name.trim().toLowerCase()
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return new Set([...counts].filter(([, n]) => n > 1).map(([k]) => k))
  }, [metrics])
  const hasDuplicateNames = duplicateNames.size > 0
  const canSave = titleValid && metricShapeValid && !hasDuplicateNames
  const saveIssue = !titleValid
    ? "Add a title to continue."
    : !hasMetric
      ? `Choose ${VALUE_SLOT_LABEL[viz].toLowerCase()} to continue.`
      : !supportsMultipleMetrics && filledMetrics.length > 1
        ? `${vizLabel} widgets use one metric. Remove the extra metrics to continue.`
        : hasDuplicateNames
          ? "Metric names must be unique."
          : null
  const saveLabel = isEdit ? "Save" : "Add widget"
  const summary = `${
    vizLabel
  } widget showing ${metricLabel || "a metric"} from ${dataSource} for ${
    persist ? RANGE_LABEL[timeRange] : "the dashboard range"
  }${viz !== "number" ? ` (${activeShapeLabel}).` : "."}`

  function patchBlock(id: string, patch: Partial<MetricBlock>) {
    setMetrics((m) => m.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  }
  function updateMetric(id: string, metricId: string) {
    patchBlock(id, { metricId })
    const nextMetric = SYSTEM_METRICS.find((m) => m.id === metricId)
    if (!titleTouched && nextMetric) setTitle(nextMetric.label)
  }
  function changeVisualization(next: WidgetType) {
    setViz(next)
    if (next !== "line" && next !== "table") {
      setMetrics((current) => current.slice(0, 1))
    }
  }
  function submit() {
    if (!canSave) return
    const id = editing ? editing.widget.id : uid("c")
    const primary = metrics.find((m) => m.metricId) ?? metrics[0]
    const usable = usableFilters(primary)

    let metricId = primary.metricId
    let extraMetric: Metric | null = null
    if (usable.length) {
      metricId = id + "_m"
      extraMetric = {
        id: metricId,
        label: title.trim(),
        owner: OWNER_ID,
        format: "count",
        source: {
          kind: "filtered",
          baseKey: primary.metricId,
          where: usable.map((f) => ({
            field: f.field as GroupField,
            value: f.value.trim(),
          })),
        },
      }
    }

    const metricIds = filledMetrics.map((m) => m.metricId)
    const savedMetricIds = supportsMultipleMetrics
      ? [metricId, ...metricIds.filter((id) => id !== primary.metricId)]
      : [metricId]
    const config: WidgetPatch["config"] = {}
    if (viz === "line") {
      config.xAxis = lineXAxis
      config.yAxis = "value"
      config.valueMetricIds = savedMetricIds
      if (lineXAxis === "time") config.viewBy = viewBy
      if (lineSplitBy !== "None") {
        config.groupBy = lineSplitBy
        config.stackBy = lineSplitBy
      }
    }
    if (viz === "bar") {
      config.categoryAxis = barCategoryAxis
      config.yAxis = "value"
      config.groupBy = barCategoryAxis
      if (barStackBy !== "None") config.stackBy = barStackBy
    }
    if (viz === "pie") {
      config.sliceBy = pieSliceBy
      config.groupBy = pieSliceBy
    }
    if (viz === "table") {
      config.rowsBy = tableRowsBy
      config.valueMetricIds = savedMetricIds
      config.groupBy = tableRowsBy
      if (tableColumnsBy !== "None") config.columnsBy = tableColumnsBy
    }
    if (viz === "heatmap") {
      config.xAxis = heatmapXAxis
      config.yAxis = heatmapYAxis
      config.colorBy = metricId
      config.groupBy = heatmapYAxis
      if (heatmapXAxis === "time" || heatmapYAxis === "time") config.viewBy = viewBy
    }
    // Display options.
    if (viz === "pie") {
      config.donut = donut
      config.percentages = percentages
      config.showLegend = showLegend
    }
    if (viz === "number") {
      const symbol = numberUnit === "none" ? "" : numberUnit
      const prefix = numberUnitPosition === "left" ? symbol : numberPrefix
      const suffix = numberUnitPosition === "right" ? symbol : numberSuffix
      if (prefix) config.numberPrefix = prefix
      if (suffix) config.numberSuffix = suffix
      config.numberDecimals = numberDecimals
    }
    if (viz === "line" || viz === "bar") {
      config.showLegend = showLegend
      config.showDataLabels = showDataLabels
    }
    const patch: WidgetPatch = {
      type: viz,
      title: title.trim(),
      span: SPAN_FOR_TYPE(viz),
      config,
      metricIds: savedMetricIds,
      dataSource,
      timeRange: persist ? timeRange : undefined,
      persistTimeRange: persist,
    }

    if (editing && onUpdate) onUpdate(id, patch, extraMetric)
    else onAdd({ id, owner: OWNER_ID, ...patch }, extraMetric)
    onClose()
  }

  const dataShapeSection = (
    <SectionShell
      title="Data shape"
      description="Define the dimensions the selected visualization needs."
    >
      {viz === "number" && (
        <ShapeNote>
          Number widgets return one scalar value. They do not use axes,
          slices, rows, or multiple metrics.
        </ShapeNote>
      )}
      {viz === "line" && (
        <>
          <ShapeNote>
            A line chart needs an X axis and one or more Y values. Use
            split series only when you want one metric broken into lines.
          </ShapeNote>
          <div className="grid gap-3 sm:grid-cols-2">
            <SlotSelect label="X axis" value={lineXAxis} options={DIMENSIONS} onChange={setLineXAxis} required />
            <SlotSelect label="Split series" value={lineSplitBy} options={GROUP_BY} onChange={setLineSplitBy} helper="Optional. Leave empty for one line per value." />
            {lineXAxis === "time" && (
              <div className="space-y-1.5">
                <FieldLabel>Time grain</FieldLabel>
                <Select value={viewBy} onValueChange={(v) => setViewBy(v as ViewByGranularity)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VIEW_BY.map((v) => (<SelectItem key={v} value={v}>{v}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </>
      )}
      {viz === "bar" && (
        <>
          <ShapeNote>A bar chart needs a category axis and one value. Stacking is optional and should use a second dimension.</ShapeNote>
          <div className="grid gap-3 sm:grid-cols-2">
            <SlotSelect label="Category axis" value={barCategoryAxis} options={DIMENSIONS} onChange={setBarCategoryAxis} required />
            <SlotSelect label="Stack by" value={barStackBy} options={GROUP_BY} onChange={setBarStackBy} helper="Optional." />
          </div>
        </>
      )}
      {viz === "pie" && (
        <>
          <ShapeNote>A pie chart needs one value split into slices. It cannot be created from a single unsplit metric.</ShapeNote>
          <SlotSelect label="Slices" value={pieSliceBy} options={DIMENSIONS} onChange={setPieSliceBy} required />
        </>
      )}
      {viz === "table" && (
        <>
          <ShapeNote>A table needs rows and at least one value column. Add more values to create multiple metric columns.</ShapeNote>
          <div className="grid gap-3 sm:grid-cols-2">
            <SlotSelect label="Rows" value={tableRowsBy} options={DIMENSIONS} onChange={setTableRowsBy} required />
            <SlotSelect label="Columns" value={tableColumnsBy} options={GROUP_BY} onChange={setTableColumnsBy} helper="Optional pivot dimension." />
          </div>
        </>
      )}
      {viz === "heatmap" && (
        <>
          <ShapeNote>A heatmap needs X and Y axes plus one color value. Use time on one axis for activity patterns.</ShapeNote>
          <div className="grid gap-3 sm:grid-cols-2">
            <SlotSelect label="X axis" value={heatmapXAxis} options={DIMENSIONS} onChange={setHeatmapXAxis} required />
            <SlotSelect label="Y axis" value={heatmapYAxis} options={DIMENSIONS} onChange={setHeatmapYAxis} required />
            {(heatmapXAxis === "time" || heatmapYAxis === "time") && (
              <div className="space-y-1.5">
                <FieldLabel>Time grain</FieldLabel>
                <Select value={viewBy} onValueChange={(v) => setViewBy(v as ViewByGranularity)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VIEW_BY.map((v) => (<SelectItem key={v} value={v}>{v}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </>
      )}
    </SectionShell>
  )

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col">
      <DialogHeader className="flex h-[57px] shrink-0 flex-row items-center gap-2 border-b px-7">
        <Plus className="size-4 text-text-muted" />
        <DialogTitle className="font-heading text-base leading-none font-medium">
          {metricMode ? "Edit metric" : isEdit ? "Edit widget" : "Add widget"}
        </DialogTitle>
      </DialogHeader>

      <div className="flex-1 min-h-0 overflow-y-auto px-7 py-4">
        <div className="flex h-full flex-col divide-y divide-border">
          {!metricMode && (<>
          <div className="space-y-1.5 pb-3">
            <FieldLabel required>Title</FieldLabel>
            <Input
              value={title}
              onChange={(e) => {
                setTitleTouched(true)
                setTitle(e.target.value)
              }}
              placeholder="Untitled widget"
              aria-invalid={!titleValid && title.length > 0}
              className="!bg-[#141414] dark:!bg-[#141414] dark:hover:!bg-[#141414]"
            />
            {!titleTouched && suggestedTitle && (
              <button
                type="button"
                onClick={() => {
                  setTitleTouched(true)
                  setTitle(suggestedTitle)
                }}
                className="text-[11px] text-text-muted transition-colors hover:text-text"
              >
                Use suggested: {suggestedTitle}
              </button>
            )}
          </div>

          <div className="space-y-1.5 py-3">
            <FieldLabel>Visualization</FieldLabel>
            <div className="flex w-full items-center gap-0.5 rounded-md border border-border bg-[#141414] p-0.5">
              {VIZ.map((v) => {
                const active = viz === v.type
                return (
                  <button
                    key={v.type}
                    type="button"
                    onClick={() => changeVisualization(v.type)}
                    title={VIZ_HELP[v.type]}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-[5px] px-2 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "bg-surface-2 text-text shadow-sm"
                        : "text-text-muted hover:bg-surface-2/60 hover:text-text"
                    )}
                  >
                    <v.Icon className={cn("size-3.5", active && "text-text")} />
                    <span>{v.label}</span>
                  </button>
                )
              })}
            </div>
            {isEdit && viz === "number" && (
              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <FieldLabel>Units</FieldLabel>
                    <Select value={numberUnit} onValueChange={setNumberUnit}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="$">$ — US Dollar</SelectItem>
                        <SelectItem value="€">€ — Euro</SelectItem>
                        <SelectItem value="£">£ — Pound</SelectItem>
                        <SelectItem value="₹">₹ — Rupee</SelectItem>
                        <SelectItem value="%">% — Percent</SelectItem>
                        <SelectItem value="s">s — Seconds</SelectItem>
                        <SelectItem value="ms">ms — Milliseconds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <FieldLabel>Position</FieldLabel>
                    <Select value={numberUnitPosition} onValueChange={(v) => setNumberUnitPosition(v as "left" | "right")}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <FieldLabel>Decimals</FieldLabel>
                    <Input
                      type="number"
                      min={0}
                      max={6}
                      value={numberDecimals}
                      onChange={(e) =>
                        setNumberDecimals(Math.max(0, Math.min(6, Number(e.target.value) || 0)))
                      }
                    />
                  </div>
                </div>
              </div>
            )}
            {isEdit && (
              <div className="space-y-2 pt-2">
                {viz === "number" && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <FieldLabel>Prefix</FieldLabel>
                      <Input value={numberPrefix} onChange={(e) => setNumberPrefix(e.target.value)} placeholder="$ ₹" />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Suffix</FieldLabel>
                      <Input value={numberSuffix} onChange={(e) => setNumberSuffix(e.target.value)} placeholder="% k" />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Decimals</FieldLabel>
                      <Input type="number" min={0} max={6} value={numberDecimals} onChange={(e) => setNumberDecimals(Math.max(0, Math.min(6, Number(e.target.value) || 0)))} />
                    </div>
                  </div>
                )}
                {viz === "pie" && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <ToggleRow title="Donut" checked={donut} onCheckedChange={setDonut} />
                      <ToggleRow title="Show labels" checked={pieShowLabels} onCheckedChange={setPieShowLabels} />
                      <ToggleRow title="Show percentages" checked={percentages} onCheckedChange={setPercentages} />
                      <ToggleRow title="Show legend" checked={showLegend} onCheckedChange={setShowLegend} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <FieldLabel>Sort</FieldLabel>
                        <Select value={pieSort} onValueChange={(v) => setPieSort(v as typeof pieSort)}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="value-desc">Value (high to low)</SelectItem>
                            <SelectItem value="value-asc">Value (low to high)</SelectItem>
                            <SelectItem value="alpha">Alphabetical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <FieldLabel>Group small as &ldquo;Other&rdquo;</FieldLabel>
                        <Select value={pieGroupSmall} onValueChange={(v) => setPieGroupSmall(v as typeof pieGroupSmall)}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="off">Off</SelectItem>
                            <SelectItem value="5">Below 5%</SelectItem>
                            <SelectItem value="10">Below 10%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <FieldLabel>Color palette</FieldLabel>
                        <Select value={piePalette} onValueChange={(v) => setPiePalette(v as typeof piePalette)}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="warm">Warm</SelectItem>
                            <SelectItem value="cool">Cool</SelectItem>
                            <SelectItem value="categorical">Categorical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
                {(viz === "line" || viz === "bar") && (
                  <div className="space-y-1.5">
                    <ToggleRow title="Show legend" checked={showLegend} onCheckedChange={setShowLegend} />
                    <ToggleRow title="Show data labels" checked={showDataLabels} onCheckedChange={setShowDataLabels} />
                  </div>
                )}
              </div>
            )}
          </div>
          </>)}

          <div className={cn("py-3", metricMode && "pt-0")}>
            {!metricMode && (
              <div className="mb-2 flex items-center justify-between">
                <FieldLabel required>Metric</FieldLabel>
              </div>
            )}
            <div className="space-y-3">
              {metrics.map((block) => (
                <div
                  key={block.id}
                  className={cn(
                    "space-y-3",
                    metrics.length > 1 && "border-b border-border pb-3 last:border-b-0 last:pb-0"
                  )}
                >
                    {metrics.length > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => patchBlock(block.id, { open: !block.open })}
                          className="flex items-center gap-2 text-sm font-medium"
                        >
                          {block.open ? (
                            <ChevronDown className="size-4" />
                          ) : (
                            <ChevronRight className="size-4" />
                          )}
                          Metric {metrics.indexOf(block) + 1}
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-auto size-7 text-muted-foreground"
                          aria-label="Remove metric"
                          onClick={() =>
                            setMetrics((m) => m.filter((b) => b.id !== block.id))
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    )}

                    {block.open && (
                      <div className="space-y-2.5">
                        {(() => {
                          const isDup = duplicateNames.has(block.name.trim().toLowerCase())
                          const showName = viz === "table"
                          const cols = showName ? "sm:grid-cols-2" : ""
                          return (
                            <div className={cn("grid items-end gap-2", cols)}>
                              {showName && (
                                <Field>
                                  <UIFieldLabel htmlFor={`metric-name-${block.id}`}>Name</UIFieldLabel>
                                  <Input
                                    id={`metric-name-${block.id}`}
                                    value={block.name}
                                    onChange={(e) => patchBlock(block.id, { name: e.target.value })}
                                    placeholder="Optional"
                                    aria-invalid={isDup}
                                    style={{ height: 32 }}
                                    className={cn("rounded-lg border border-input !bg-[#141414] py-2 pr-2 pl-2.5 text-sm hover:!bg-[#141414] dark:!bg-[#141414] dark:hover:!bg-[#141414]", isDup && "border-destructive focus-visible:ring-destructive/40")}
                                  />
                                  {isDup && (
                                    <p className="text-[11px] text-destructive">Name already used.</p>
                                  )}
                                </Field>
                              )}
                              <Field>
                                {showName && <UIFieldLabel>Measure</UIFieldLabel>}
                                <MetricPicker
                                  value={block.metricId}
                                  onChange={(value) => updateMetric(block.id, value)}
                                  placeholder="Select metric"
                                />
                              </Field>
                            </div>
                          )
                        })()}

                        {(() => {
                          const activeConds = block.filters.conditions.filter(conditionIsActive)
                          const isOpen = filterPanelFor === block.id
                          return (
                            <div className="space-y-2">
                              <button
                                type="button"
                                onClick={() => setFilterPanelFor(isOpen ? null : block.id)}
                                className={cn(
                                  "inline-flex items-center gap-1.5 text-[12px] transition-colors",
                                  isOpen
                                    ? "text-text"
                                    : "text-text-muted hover:text-text"
                                )}
                              >
                                <FunnelIcon className="size-3.5" />
                                {activeConds.length > 0 ? `Filters · ${activeConds.length}` : "Add filter"}
                              </button>
                              {activeConds.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {activeConds.map((c) => {
                                    const label = conditionLabel(c)
                                    if (!label) return null
                                    return (
                                      <span
                                        key={c.id}
                                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2/60 py-1 pl-2 pr-1 text-xs text-text"
                                      >
                                        <span className="size-1.5 shrink-0 rounded-full bg-emerald-400" />
                                        <span className="truncate max-w-[220px]">{label}</span>
                                        <button
                                          type="button"
                                          aria-label={`Remove ${label}`}
                                          onClick={() => {
                                            setMetrics((prev) =>
                                              prev.map((b) =>
                                                b.id === block.id
                                                  ? {
                                                      ...b,
                                                      filters: filterReducer(b.filters, {
                                                        type: "REMOVE_CONDITION",
                                                        id: c.id,
                                                      }),
                                                    }
                                                  : b
                                              )
                                            )
                                          }}
                                          className="rounded p-0.5 text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
                                        >
                                          <X className="size-3" />
                                        </button>
                                      </span>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    )}
                </div>
              ))}

            </div>
            {!metricMode && supportsMultipleMetrics && (
              <button
                type="button"
                onClick={() => setMetrics((m) => [...m, newMetricBlock()])}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-xs text-text-muted transition-colors hover:border-text-dim hover:text-text"
              >
                <Plus className="size-3.5" /> Add metric
              </button>
            )}
          </div>

          {!metricMode && viz !== "table" && viz !== "number" && viz !== "pie" && (
            <div className="space-y-1.5 py-3">
              <FieldLabel>Group by</FieldLabel>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Combobox
                    items={GROUP_BY.filter((g) => g !== "None").map((g) => GROUP_LABELS[g] ?? g)}
                    value={widgetGroupBy === "None" ? undefined : (GROUP_LABELS[widgetGroupBy] ?? widgetGroupBy)}
                    onValueChange={(label) => {
                      const found = GROUP_BY.find((g) => (GROUP_LABELS[g] ?? g) === label)
                      if (found) setWidgetGroupBy(found)
                    }}
                  >
                    <ComboboxInput className="h-9 rounded-lg text-sm" placeholder="Select dimension" />
                    <ComboboxContent>
                      <ComboboxEmpty>No dimensions found.</ComboboxEmpty>
                      <ComboboxList>
                        {(item) => (
                          <ComboboxItem key={item} value={item}>
                            {item}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>
                {widgetGroupBy === "time" && (
                  <Select value={viewBy} onValueChange={(v) => setViewBy(v as ViewByGranularity)}>
                    <SelectTrigger className="h-9 w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VIEW_BY.map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}

          {!metricMode && viz === "table" && (
            <div className="space-y-1.5 py-3">
              <FieldLabel>Group by</FieldLabel>
              <div className="flex items-center gap-2">
                <GroupByMultiPicker
                  value={widgetGroupByList}
                  onChange={setWidgetGroupByList}
                />
                {widgetGroupByList.includes("time") && (
                  <Select value={viewBy} onValueChange={(v) => setViewBy(v as ViewByGranularity)}>
                    <SelectTrigger className="h-9 w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VIEW_BY.map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}

          {!metricMode && (
            <div className="space-y-1.5 py-3">
              <FieldLabel>Range</FieldLabel>
              <div className="flex items-center gap-3 rounded-md border border-border bg-[#141414] px-3 py-2">
                <Switch checked={persist} onCheckedChange={setPersist} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-text">Use a custom time range</p>
                  <p className="text-[11px] text-text-muted">
                    {persist ? "This widget uses its own range." : "Off — follows the dashboard's range."}
                  </p>
                </div>
                {persist && (
                  <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                    <SelectTrigger className="h-8 w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(RANGE_LABEL) as TimeRange[]).map((r) => (
                        <SelectItem key={r} value={r}>{RANGE_LABEL[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      <DialogFooter className="mx-0 mb-0 flex h-[57px] shrink-0 items-center rounded-none border-t bg-[#141414] px-7 py-0 sm:flex-row sm:justify-between">
        <p className={cn("max-w-xl text-[11px]", saveIssue ? "text-amber-400" : "text-text-muted")}>
          {saveIssue ?? summary}
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={!canSave}>
            {saveLabel}
          </Button>
        </div>
      </DialogFooter>
      </div>

      {filterPanelFor && (() => {
        const block = metrics.find((m) => m.id === filterPanelFor)
        if (!block) return null
        const dispatch: React.Dispatch<FilterAction> = (action) => {
          setMetrics((prev) =>
            prev.map((b) =>
              b.id === block.id ? { ...b, filters: filterReducer(b.filters, action) } : b
            )
          )
        }
        return (
          <aside
            className={cn(
              "relative flex h-full shrink-0 flex-col border-l border-border bg-[#141414] transition-[width] duration-200 ease-out",
              filterCollapsed ? "w-[40px]" : "w-[300px]"
            )}
          >
            {filterCollapsed ? (
              <button
                type="button"
                onClick={() => setFilterCollapsed(false)}
                aria-label="Expand filters"
                className="flex h-full w-full items-center justify-center text-text-muted hover:bg-surface-2/60 hover:text-text"
              >
                <ChevronLeft className="size-4" />
              </button>
            ) : (
              <>
                <div className="flex h-[57px] shrink-0 items-center gap-2 border-b px-7">
                  <FunnelIcon className="size-4 text-text-muted" />
                  <h2 className="font-heading text-base leading-none font-medium">Filters</h2>
                </div>
                <div className="min-h-0 flex-1">
                  <FilterMenu
                    filters={block.filters}
                    dispatch={dispatch}
                    onOpenAdvanced={() => {}}
                    close={() => setFilterPanelFor(null)}
                  />
                </div>
              </>
            )}
          </aside>
        )
      })()}
    </div>
  )
}
