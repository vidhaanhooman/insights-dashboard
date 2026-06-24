"use client"

import * as React from "react"
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import type {
  GroupField,
  Metric,
  TimeRange,
  ViewByGranularity,
  Widget,
  WidgetType,
} from "@/lib/insights/types"
import { cn } from "@/lib/utils"
import { FilterBuilder, type FilterRow } from "./filter-builder"

const OWNER_ID = "you"
const DATA_SOURCES = ["Conversations", "Calls", "Tasks"]
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
const VIEW_BY = ["Hour", "Day", "Month"]

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
  filters: FilterRow[]
}

export interface BuilderTarget {
  widget: Widget
  metric?: Metric
}

function newMetricBlock(metricId = ""): MetricBlock {
  return { id: uid("m"), metricId, agg: "Sum", name: "", open: true, filters: [] }
}

function initialBlocks(editing?: BuilderTarget | null): MetricBlock[] {
  if (!editing) return [newMetricBlock()]
  const src = editing.metric?.source
  const base =
    src?.kind === "filtered" ? src.baseKey : editing.widget.metricIds[0]
  const filters: FilterRow[] =
    src?.kind === "filtered"
      ? src.where.map((w) => ({
          id: uid("f"),
          field: w.field,
          op: "==",
          value: w.value,
        }))
      : []
  return [
    { id: uid("m"), metricId: base ?? "", agg: "Sum", name: "", open: true, filters },
  ]
}

function usableFilters(block: MetricBlock) {
  return block.filters.filter(
    (f) =>
      (f.field === "outcome" || f.field === "agent") &&
      f.op === "==" &&
      f.value.trim()
  )
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <BuilderForm
          key={editing?.widget.id ?? "new"}
          editing={editing}
          onAdd={onAdd}
          onUpdate={onUpdate}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium text-text-muted">{children}</p>
  )
}

function BuilderForm({
  editing,
  onAdd,
  onUpdate,
  onClose,
}: {
  editing?: BuilderTarget | null
  onAdd: (widget: Widget, extraMetric: Metric | null) => void
  onUpdate?: (id: string, patch: WidgetPatch, extraMetric: Metric | null) => void
  onClose: () => void
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
  const [groupBy, setGroupBy] = React.useState(
    editing?.widget.config.groupBy ?? "None"
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
  const [metrics, setMetrics] = React.useState<MetricBlock[]>(() =>
    initialBlocks(editing)
  )

  const titleValid = title.trim().length >= 2
  const hasMetric = metrics.some((m) => m.metricId)
  // Metric names must be unique (case-insensitive) among the ones that are filled in.
  const dupeNames = React.useMemo(() => {
    const counts: Record<string, number> = {}
    metrics.forEach((m) => {
      const n = m.name.trim().toLowerCase()
      if (n) counts[n] = (counts[n] ?? 0) + 1
    })
    return new Set(
      Object.entries(counts)
        .filter(([, c]) => c > 1)
        .map(([n]) => n)
    )
  }, [metrics])
  const canSave = titleValid && hasMetric && dupeNames.size === 0
  const isDupe = (b: MetricBlock) =>
    !!b.name.trim() && dupeNames.has(b.name.trim().toLowerCase())

  function patchBlock(id: string, patch: Partial<MetricBlock>) {
    setMetrics((m) => m.map((b) => (b.id === id ? { ...b, ...patch } : b)))
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

    const config: WidgetPatch["config"] = {}
    if (!SCALAR_TYPES.includes(viz) && groupBy !== "None") {
      config.groupBy = groupBy
      if (groupBy === "time") config.viewBy = viewBy
    }
    // Display options (pie).
    if (viz === "pie") {
      config.donut = donut
      config.percentages = percentages
      config.showLegend = showLegend
    }
    const patch: WidgetPatch = {
      type: viz,
      title: title.trim(),
      span: SPAN_FOR_TYPE(viz),
      config,
      metricIds: [metricId],
      dataSource,
      timeRange,
      persistTimeRange: persist,
    }

    if (editing && onUpdate) onUpdate(id, patch, extraMetric)
    else onAdd({ id, owner: OWNER_ID, ...patch }, extraMetric)
    onClose()
  }

  return (
    <>
      <DialogHeader className="shrink-0 border-b px-6 py-4">
        <DialogTitle>
          {metricMode ? "Edit metric" : isEdit ? "Edit widget" : "Add widget"}
        </DialogTitle>
        <p className="text-xs text-muted-foreground">
          {metricMode
            ? "Edit the metric, its name, and filters"
            : "Configure how this metric is visualized"}
        </p>
      </DialogHeader>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
        {!metricMode && (
        <div className="space-y-2">
          <SectionLabel>Visualization</SectionLabel>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {VIZ.map((v) => {
                const active = viz === v.type
                return (
                  <button
                    key={v.type}
                    type="button"
                    onClick={() => setViz(v.type)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 rounded-lg border py-3 text-xs font-medium transition-colors",
                      active
                        ? "border-ring bg-accent-dim text-text"
                        : "border-border text-text-muted hover:border-border-strong hover:bg-surface-2/50 hover:text-text"
                    )}
                  >
                    <v.Icon className={cn("size-4", active && "text-brand")} />
                    {v.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

          <div className="space-y-3">
            <SectionLabel>Details</SectionLabel>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter widget title"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <Label className="text-sm font-normal">Data source</Label>
                <Select value={dataSource} onValueChange={setDataSource}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_SOURCES.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-1.5">
                <Label className="text-sm font-normal">Time range</Label>
                <Select
                  value={timeRange}
                  onValueChange={(v) => setTimeRange(v as TimeRange)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(RANGE_LABEL) as TimeRange[]).map((r) => (
                      <SelectItem key={r} value={r}>
                        {RANGE_LABEL[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <Label className="text-sm font-normal">Persist time range</Label>
              <Switch checked={persist} onCheckedChange={setPersist} />
            </div>
          </div>

        {viz === "pie" && (
          <div className="space-y-3">
            <SectionLabel>Display</SectionLabel>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-normal">Display as donut</Label>
              <Switch checked={donut} onCheckedChange={setDonut} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-normal">Display as percentages</Label>
              <Switch checked={percentages} onCheckedChange={setPercentages} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-normal">Show legend</Label>
              <Switch checked={showLegend} onCheckedChange={setShowLegend} />
            </div>
          </div>
        )}

        {!SCALAR_TYPES.includes(viz) && (
          <div className="space-y-3">
            <SectionLabel>Grouping</SectionLabel>
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <Label className="text-sm font-normal">Group by</Label>
                <Select value={groupBy} onValueChange={setGroupBy}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GROUP_BY.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {groupBy === "time" && (
                <div className="flex-1 space-y-1.5">
                  <Label className="text-sm font-normal">View by</Label>
                  <Select
                    value={viewBy}
                    onValueChange={(v) => setViewBy(v as ViewByGranularity)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VIEW_BY.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <SectionLabel>Metrics</SectionLabel>
            {metrics.map((block) => (
              <Card key={block.id} size="sm" className="gap-0 bg-surface-2/30">
                <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => patchBlock(block.id, { open: !block.open })}
                    className="flex items-center gap-2 text-sm font-medium"
                  >
                    {block.open ? (
                      <ChevronDown className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                    Metric details
                  </button>
                  {metrics.length > 1 && (
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
                  )}
                </div>

                {block.open && (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-sm font-normal">Field</Label>
                        <Select
                          value={block.metricId}
                          onValueChange={(v) =>
                            patchBlock(block.id, { metricId: v })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            {SYSTEM_METRICS.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {!SCALAR_TYPES.includes(viz) && (
                        <div className="w-[140px] shrink-0 space-y-1.5">
                          <Label className="text-sm font-normal">Type</Label>
                          <Select
                            value={block.agg}
                            onValueChange={(v) => patchBlock(block.id, { agg: v })}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {AGG_TYPES.map((a) => (
                                <SelectItem key={a} value={a}>
                                  {a}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div>
                        <Label className="text-sm font-normal">Name</Label>
                        <p className="text-xs text-text-muted">
                          {viz === "table"
                            ? "Unique name for this column in the table"
                            : "Unique name for this metric"}
                        </p>
                      </div>
                      <Input
                        value={block.name}
                        onChange={(e) =>
                          patchBlock(block.id, { name: e.target.value })
                        }
                        placeholder="e.g. Total calls"
                        aria-invalid={isDupe(block)}
                      />
                      {isDupe(block) && (
                        <p className="text-xs text-destructive">
                          This name is already used — names must be unique.
                        </p>
                      )}
                    </div>

                    <FilterBuilder
                      filters={block.filters}
                      onChange={(f) => patchBlock(block.id, { filters: f })}
                    />
                  </div>
                )}
                </CardContent>
              </Card>
            ))}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setMetrics((m) => [...m, newMetricBlock()])}
            >
              <Plus /> Add metric
            </Button>
          </div>

      </div>

      <DialogFooter className="mx-0 mb-0 shrink-0 rounded-none border-t bg-transparent px-6 py-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={!canSave}>
          Done
        </Button>
      </DialogFooter>
    </>
  )
}

