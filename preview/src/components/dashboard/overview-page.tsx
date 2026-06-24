"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"
import {
  Download,
  Info,
  LayoutDashboard,
  Plus,
  RefreshCw,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { DateRangePicker } from "@/components/date-range-picker"
import { SYSTEM_METRICS } from "@/lib/insights/registry"
import {
  useConversations,
  useGrouped,
  useKpiSummary,
  usePickupByTime,
  useSeries,
} from "@/lib/insights/hooks"
import { formatValue } from "@/lib/insights/resolver"
import type { Metric, TimeRange, Widget } from "@/lib/insights/types"
import { cn } from "@/lib/utils"
import { AgentPicker } from "./agent-picker"
import { AppSidebar } from "./app-sidebar"
import { ChartToolbar } from "./chart-toolbar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WidgetBuilder } from "./widget-builder"
import { WidgetBoard, defaultLayout, type BoardLayout } from "./widget-board"
import { BarDetail, LinePanel, PanelCard, PiePanel } from "./views/panels"
import { MetricBreakdown } from "./widgets/metric-breakdown"
import { WidgetRenderer } from "./widgets/widget-renderer"

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

const TABS = ["Overview", "Outbound", "Inbound", "Tasks", "Tools"] as const

const CONVO_SERIES = [
  { key: "Inbound", label: "Inbound", color: "#3a6ae6" },
  { key: "Outbound", label: "Outbound", color: "#6f9cf6" },
  { key: "Web", label: "Web", color: "#2546b3" },
  { key: "Tasks", label: "Tasks created", color: "#a9caff" },
]

interface StatCard {
  label: string
  sub: string
  value: string
  highlight?: boolean
  /** Extra rows revealed in the info popover. */
  details: { label: string; value: string }[]
  note?: string
}

const pct = (part: number, whole: number) =>
  whole ? `${Math.round((part / whole) * 100)}%` : "0%"

function StatCards({
  range,
  refreshKey,
}: {
  range: TimeRange
  refreshKey: number
}) {
  const { data, loading } = useKpiSummary(range, refreshKey)

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 self-start">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[92px] w-full rounded-xl" />
        ))}
      </div>
    )
  }

  const totalCalls = data.inbound.calls + data.outbound.calls
  const cards: StatCard[] = [
    {
      label: "Inbound",
      sub: `Avg ${formatValue(data.inbound.avgDur, "duration")}`,
      value: formatValue(data.inbound.calls, "count"),
      details: [
        { label: "Calls", value: formatValue(data.inbound.calls, "count") },
        { label: "Avg duration", value: formatValue(data.inbound.avgDur, "duration") },
        { label: "Share of calls", value: pct(data.inbound.calls, totalCalls) },
        { label: "Talk time", value: formatValue(data.inbound.calls * data.inbound.avgDur, "duration") },
      ],
      note: "Calls received by your agents in the selected range.",
    },
    {
      label: "Outbound",
      sub: `Avg ${formatValue(data.outbound.avgDur, "duration")}`,
      value: formatValue(data.outbound.calls, "count"),
      details: [
        { label: "Calls", value: formatValue(data.outbound.calls, "count") },
        { label: "Avg duration", value: formatValue(data.outbound.avgDur, "duration") },
        { label: "Share of calls", value: pct(data.outbound.calls, totalCalls) },
        { label: "Talk time", value: formatValue(data.outbound.calls * data.outbound.avgDur, "duration") },
      ],
      note: "Calls placed by your agents in the selected range.",
    },
    {
      label: "Tasks",
      sub: `${formatValue(data.tasks.running, "count")} running`,
      value: formatValue(data.tasks.created, "count"),
      details: [
        { label: "Created", value: formatValue(data.tasks.created, "count") },
        { label: "Running", value: formatValue(data.tasks.running, "count") },
        { label: "Settled", value: formatValue(Math.max(0, data.tasks.created - data.tasks.running), "count") },
        { label: "Running share", value: pct(data.tasks.running, data.tasks.created) },
      ],
      note: "Background tasks queued by conversations.",
    },
    {
      label: "Total Calls",
      sub: "All channels",
      value: formatValue(totalCalls, "count"),
      highlight: true,
      details: [
        { label: "Inbound", value: `${formatValue(data.inbound.calls, "count")} · ${pct(data.inbound.calls, totalCalls)}` },
        { label: "Outbound", value: `${formatValue(data.outbound.calls, "count")} · ${pct(data.outbound.calls, totalCalls)}` },
        { label: "Total", value: formatValue(totalCalls, "count") },
      ],
      note: "Inbound and outbound calls combined.",
    },
  ]

  return (
    <div className="grid h-full grid-cols-2 grid-rows-2 gap-4">
      {cards.map((c) => (
        <Popover key={c.label}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "group flex h-full flex-col justify-between gap-3 rounded-xl border px-4 py-4 text-left transition-colors",
                c.highlight
                  ? "border-[#3a6ae6]/45 bg-[#3a6ae6]/10 hover:bg-[#3a6ae6]/15"
                  : "border-border bg-card hover:border-border-strong hover:bg-surface-2/40"
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      c.highlight ? "text-[#9cc0ff]" : "text-text"
                    )}
                  >
                    {c.label}
                  </p>
                  <Info className="size-3.5 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <p className="mt-0.5 text-xs text-text-muted">{c.sub}</p>
              </div>
              <p
                className={cn(
                  "text-3xl font-semibold tracking-tight tabular-nums",
                  c.highlight ? "text-[#cfe0ff]" : "text-text"
                )}
              >
                {c.value}
              </p>
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-0">
            <div className="border-b px-4 py-2.5">
              <p className="text-sm font-medium text-text">{c.label}</p>
              {c.note && (
                <p className="mt-0.5 text-xs text-text-muted">{c.note}</p>
              )}
            </div>
            <dl className="px-4 py-2">
              {c.details.map((d) => (
                <div
                  key={d.label}
                  className="flex items-center justify-between py-1.5 text-sm"
                >
                  <dt className="text-text-muted">{d.label}</dt>
                  <dd className="font-medium tabular-nums text-text">{d.value}</dd>
                </div>
              ))}
            </dl>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  )
}

function ConversationsPanel({
  range,
  refreshKey,
  onEdit,
}: {
  range: TimeRange
  refreshKey: number
  onEdit?: () => void
}) {
  const { data, loading } = useConversations(range, refreshKey)
  return (
    <LinePanel
      title="Conversations & Tasks"
      description="Daily volume across channels for the selected range"
      loading={loading}
      data={data}
      series={CONVO_SERIES}
      onEdit={onEdit}
    />
  )
}

function CallsPanel({
  range,
  refreshKey,
  onEdit,
  fill,
}: {
  range: TimeRange
  refreshKey: number
  onEdit?: () => void
  fill?: boolean
}) {
  const { data, loading } = useSeries(range, refreshKey)
  return (
    <LinePanel
      title="Calls attempted & connected"
      description="Attempts vs. connections over time"
      loading={loading}
      data={data}
      series={[
        { key: "Attempted", label: "Attempted", color: "var(--chart-1)" },
        { key: "Connected", label: "Connected", color: "var(--chart-2)" },
      ]}
      onEdit={onEdit}
      fill={fill}
    />
  )
}

function OutcomePanel({
  range,
  refreshKey,
  onEdit,
}: {
  range: TimeRange
  refreshKey: number
  onEdit?: () => void
}) {
  const { data, loading } = useGrouped("outcome", range, refreshKey)
  return (
    <PiePanel
      title="Outcome breakdown"
      description="Share of calls by outcome"
      loading={loading}
      data={data}
      onEdit={onEdit}
      donut
      legend="bottom"
      square
      range={range}
      refreshKey={refreshKey}
      groupBy="outcome"
    />
  )
}

function AgentBarPanel({
  range,
  refreshKey,
  onEdit,
}: {
  range: TimeRange
  refreshKey: number
  onEdit?: () => void
}) {
  const { data, loading } = useGrouped("agent", range, refreshKey)
  const config = {
    value: { label: "Calls", color: "var(--chart-1)" },
  } satisfies ChartConfig
  return (
    <PanelCard
      title="Calls by agent"
      onEdit={onEdit}
      className="aspect-square w-full"
      dialogClassName="flex h-[90vh] w-[94vw] max-w-[94vw] flex-col sm:max-w-[94vw]"
      enlargeContent={loading ? undefined : <BarDetail data={data} />}
    >
      {loading ? (
        <Skeleton className="h-full min-h-[240px] w-full" />
      ) : (
        <ChartContainer config={config} className="h-full min-h-[240px] w-full">
          <BarChart
            data={data}
            margin={{ top: 8, right: 12, left: -12 }}
            barCategoryGap="28%"
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={36}>
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </PanelCard>
  )
}

function PickupPanel({
  range,
  refreshKey,
  onEdit,
}: {
  range: TimeRange
  refreshKey: number
  onEdit?: () => void
}) {
  const { data, loading } = usePickupByTime(range, refreshKey)
  return (
    <LinePanel
      title="Pickup rate over time"
      description="Connected share by hour of day"
      loading={loading}
      data={data}
      series={[{ key: "value", label: "Pickup rate", color: "var(--chart-1)" }]}
      onEdit={onEdit}
    />
  )
}

export function OverviewPage() {
  const [range] = React.useState<TimeRange>("7d")
  const [dateStart, setDateStart] = React.useState("2026-06-16T00:00")
  const [dateEnd, setDateEnd] = React.useState("2026-06-23T23:59")
  const [agentId, setAgentId] = React.useState("")
  const [tab, setTab] = React.useState<string>("Overview")
  const [refreshKey, setRefreshKey] = React.useState(0)

  // Widget board (mirrors the dark dashboard's per-tab widget model).
  const [widgets, setWidgets] = React.useState<Widget[]>([])
  const [layouts, setLayouts] = React.useState<Record<string, BoardLayout>>({})
  const [customMetrics, setCustomMetrics] = React.useState<Metric[]>([])
  const [widgetRefresh, setWidgetRefresh] = React.useState<
    Record<string, number>
  >({})
  const [builderOpen, setBuilderOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [expandedId, setExpandedId] = React.useState<string | null>(null)

  const metricsById = React.useMemo(() => {
    const all: Record<string, Metric> = {}
    ;[...SYSTEM_METRICS, ...customMetrics].forEach((m) => (all[m.id] = m))
    return all
  }, [customMetrics])

  function addWidget(widget: Widget, extraMetric: Metric | null) {
    if (extraMetric) setCustomMetrics((m) => [...m, extraMetric])
    setWidgets((w) => [...w, widget])
    setLayouts((l) => ({ ...l, [widget.id]: defaultLayout(widget.type) }))
  }
  function removeWidget(id: string) {
    setWidgets((w) => w.filter((x) => x.id !== id))
    setLayouts((l) => {
      const next = { ...l }
      delete next[id]
      return next
    })
  }
  function reorderWidgets(ids: string[]) {
    setWidgets((w) => ids.map((id) => w.find((x) => x.id === id)!).filter(Boolean))
  }
  function resizeWidget(id: string, layout: BoardLayout) {
    setLayouts((l) => ({ ...l, [id]: layout }))
  }
  function updateWidget(
    id: string,
    patch: Partial<Widget>,
    extraMetric: Metric | null
  ) {
    if (extraMetric)
      setCustomMetrics((m) => [
        ...m.filter((x) => x.id !== extraMetric.id),
        extraMetric,
      ])
    setWidgets((w) => w.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  }
  function renameWidget(id: string, title: string) {
    setWidgets((w) => w.map((x) => (x.id === id ? { ...x, title } : x)))
  }
  function duplicateWidget(id: string) {
    const copyId = "d" + Math.abs(Date.now() % 1e6).toString(36)
    setWidgets((w) => {
      const i = w.findIndex((x) => x.id === id)
      if (i < 0) return w
      const src = w[i]
      const copy: Widget = {
        ...src,
        id: copyId,
        title: `${src.title} (copy)`,
        owner: "you",
      }
      return [...w.slice(0, i + 1), copy, ...w.slice(i + 1)]
    })
    setLayouts((l) => ({
      ...l,
      [copyId]: l[id] ?? defaultLayout("number"),
    }))
  }
  function refreshWidget(id: string) {
    setWidgetRefresh((m) => ({ ...m, [id]: (m[id] ?? 0) + 1 }))
  }
  function keyFor(id: string) {
    return refreshKey + (widgetRefresh[id] ?? 0)
  }
  function openEditor(id: string) {
    setEditingId(id)
    setBuilderOpen(true)
  }
  function openBuilder() {
    setEditingId(null)
    setBuilderOpen(true)
  }
  function controlsFor(w: Widget) {
    return {
      onRemove: () => removeWidget(w.id),
      onRename: (t: string) => renameWidget(w.id, t),
      onEdit: () => openEditor(w.id),
      onExpand: () => setExpandedId(w.id),
      onDuplicate: () => duplicateWidget(w.id),
      onRefresh: () => refreshWidget(w.id),
    }
  }

  const editing = React.useMemo(() => {
    if (!editingId) return null
    const w = widgets.find((x) => x.id === editingId)
    if (!w) return null
    return { widget: w, metric: metricsById[w.metricIds[0]] }
  }, [editingId, widgets, metricsById])

  const expanded = widgets.find((w) => w.id === expandedId)

  return (
    <div className="dark flex min-h-screen bg-background text-foreground">
      <AppSidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-col gap-3 border-b px-5 pt-3.5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <span className="text-[15px] font-semibold">Insights</span>
            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRefreshKey((k) => k + 1)}
              >
                <RefreshCw /> Refresh
              </Button>
              <Button size="sm" onClick={openBuilder}>
                <Plus /> Add widget
              </Button>
            </div>
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            {/* -ml offsets the list/trigger padding so the first tab lines up
                with "Insights"; -mb-px seats the active underline on the border. */}
            <TabsList variant="line" className="-mb-px -ml-[10px]">
              {TABS.map((t) => (
                <TabsTrigger key={t} value={t}>
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </header>

        <div className="overflow-x-hidden px-7 py-6">
          {/* Sub-toolbar */}
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <button className="flex items-center gap-1.5 text-sm text-text-dim hover:text-text">
                Download csv <Download className="size-3.5" />
              </button>
              <DateRangePicker
                startValue={dateStart}
                endValue={dateEnd}
                onApply={(s, e) => {
                  setDateStart(s)
                  setDateEnd(e)
                }}
              />
              <AgentPicker agentId={agentId} onChange={setAgentId} />
            </div>
          </div>

          {/* Stats block + hero line */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <StatCards range={range} refreshKey={refreshKey} />
            <ConversationsPanel range={range} refreshKey={refreshKey} />
          </div>

          {/* Calls attempted (left, fills) with the two square panels stacked on its right */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CallsPanel range={range} refreshKey={refreshKey} fill />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <OutcomePanel range={range} refreshKey={refreshKey} />
              <AgentBarPanel range={range} refreshKey={refreshKey} />
            </div>
          </div>

          {/* Pickup rate — full width below */}
          <div className="mt-4">
            <PickupPanel range={range} refreshKey={refreshKey} />
          </div>

          {/* Widget board — drag to reorder, drag the corner to resize. */}
          {widgets.length > 0 ? (
            <div className="mt-4">
              <WidgetBoard
                widgets={widgets}
                layouts={layouts}
                onReorder={reorderWidgets}
                onResize={resizeWidget}
                renderItem={(w) => (
                  <WidgetRenderer
                    widget={w}
                    metricsById={metricsById}
                    range={range}
                    refreshKey={keyFor(w.id)}
                    ctl={controlsFor(w)}
                    onConfigure={() => openEditor(w.id)}
                  />
                )}
              />
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-4 rounded-xl border border-dashed border-border-strong px-5 py-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-2 text-text-muted">
                <LayoutDashboard size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text">Add more to your board</p>
                <p className="text-xs text-text-muted">
                  Track any metric as a number, line, bar, pie, or table widget.
                </p>
              </div>
              <Button size="sm" onClick={openBuilder}>
                <Plus /> Add widget
              </Button>
            </div>
          )}
        </div>
      </main>

      <WidgetBuilder
        open={builderOpen}
        onOpenChange={(o) => {
          setBuilderOpen(o)
          if (!o) setEditingId(null)
        }}
        onAdd={addWidget}
        onUpdate={updateWidget}
        editing={editing}
      />

      <Dialog open={!!expanded} onOpenChange={(o) => !o && setExpandedId(null)}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{expanded?.title}</DialogTitle>
          </DialogHeader>
          {expanded && (
            <>
              <ChartToolbar />
              {expanded.type === "number" ? (
                <MetricBreakdown range={range} refreshKey={keyFor(expanded.id)} />
              ) : (
                <WidgetRenderer
                  widget={{ ...expanded, span: 1 }}
                  metricsById={metricsById}
                  range={range}
                  refreshKey={keyFor(expanded.id)}
                  ctl={{ onRename: (t) => renameWidget(expanded.id, t) }}
                />
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
