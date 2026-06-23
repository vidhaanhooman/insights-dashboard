"use client"

import * as React from "react"
import { LayoutDashboard, Plus, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DateRangePicker } from "@/components/date-range-picker"
import { SYSTEM_METRICS } from "@/lib/insights/registry"
import type { Metric, TimeRange, Widget } from "@/lib/insights/types"
import { cn } from "@/lib/utils"
import { AppSidebar } from "./app-sidebar"
import { ChartToolbar } from "./chart-toolbar"
import { AgentPicker } from "./agent-picker"
import { ConversationsChart } from "./conversations-chart"
import { InboundView } from "./inbound-view"
import { OutboundView } from "./outbound-view"
import { KpiStrip } from "./kpi-strip"
import { SegmentedToggle } from "./segmented-toggle"
import { WidgetBuilder } from "./widget-builder"
import { MetricBreakdown } from "./widgets/metric-breakdown"
import { WidgetRenderer } from "./widgets/widget-renderer"

const TABS = ["Overview", "Outbound", "Inbound", "Tasks", "Tools"] as const
type Tab = (typeof TABS)[number]

export function InsightsDashboard() {
  const [range] = React.useState<TimeRange>("7d")
  const [dateStart, setDateStart] = React.useState("2026-06-16T00:00")
  const [dateEnd, setDateEnd] = React.useState("2026-06-23T23:59")
  const [tab, setTab] = React.useState<Tab>("Overview")
  const [agentId, setAgentId] = React.useState("")
  // Each tab owns its own dashboard of widgets.
  const [widgetsByTab, setWidgetsByTab] = React.useState<
    Record<string, Widget[]>
  >({})
  const widgets = React.useMemo(
    () => widgetsByTab[tab] ?? [],
    [widgetsByTab, tab]
  )
  const setTabWidgets = (fn: (w: Widget[]) => Widget[]) =>
    setWidgetsByTab((prev) => ({ ...prev, [tab]: fn(prev[tab] ?? []) }))
  const [customMetrics, setCustomMetrics] = React.useState<Metric[]>([])
  const [refreshKey, setRefreshKey] = React.useState(0)
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
    setTabWidgets((w) => [...w, widget])
  }
  function removeWidget(id: string) {
    setTabWidgets((w) => w.filter((x) => x.id !== id))
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
    setTabWidgets((w) => w.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  }
  function renameWidget(id: string, title: string) {
    setTabWidgets((w) => w.map((x) => (x.id === id ? { ...x, title } : x)))
  }
  function duplicateWidget(id: string) {
    setTabWidgets((w) => {
      const i = w.findIndex((x) => x.id === id)
      if (i < 0) return w
      const src = w[i]
      const copy: Widget = {
        ...src,
        id: "d" + Math.abs(Date.now() % 1e6).toString(36),
        title: `${src.title} (copy)`,
        owner: "you",
      }
      return [...w.slice(0, i + 1), copy, ...w.slice(i + 1)]
    })
  }
  function refresh() {
    setRefreshKey((k) => k + 1)
  }
  // Per-widget refresh — only re-runs the chosen widget's metric, not the whole board.
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

  const cell = (w: Widget, hero = false) => (
    <div
      key={w.id}
      className={cn(w.span === 2 ? "md:col-span-2" : "md:col-span-1")}
    >
      <WidgetRenderer
        widget={w}
        metricsById={metricsById}
        range={range}
        refreshKey={keyFor(w.id)}
        ctl={controlsFor(w)}
        onConfigure={() => openEditor(w.id)}
        hero={hero}
      />
    </div>
  )

  const emptyState = (
    <div className="flex items-center gap-4 rounded-lg border border-dashed border-border-strong px-5 py-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-2 text-text-muted">
        <LayoutDashboard size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text">Your dashboard is empty</p>
        <p className="text-xs text-text-muted">
          Add a widget to start tracking the metrics you care about.
        </p>
      </div>
      <Button size="sm" onClick={openBuilder}>
        <Plus /> Add widget
      </Button>
    </div>
  )

  const widgetGrid =
    widgets.length > 0 ? (
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
        {widgets.map((w) => cell(w))}
      </div>
    ) : null

  return (
    <div className="dark flex min-h-screen bg-background text-foreground">
      <AppSidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b px-5 py-3.5">
          <span className="text-[15px] font-semibold">Insights</span>
          <SegmentedToggle
            options={TABS.map((t) => ({ value: t, label: t }))}
            value={tab}
            onChange={(v) => setTab(v as Tab)}
          />
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw /> Refresh
            </Button>
            <Button size="sm" onClick={openBuilder}>
              <Plus /> Add widget
            </Button>
          </div>
        </header>

        <div className="flex items-center gap-3 px-5 pt-4">
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

        {tab === "Overview" ? (
          <div className="space-y-5 p-5">
            <KpiStrip range={range} refreshKey={refreshKey} />
            <ConversationsChart range={range} refreshKey={refreshKey} />
            {widgetGrid}
          </div>
        ) : tab === "Inbound" ? (
          <div>
            <InboundView
              range={range}
              refreshKey={refreshKey}
              onEdit={openBuilder}
            />
            {widgetGrid && <div className="px-5 pb-5">{widgetGrid}</div>}
          </div>
        ) : tab === "Outbound" ? (
          <div>
            <OutboundView
              range={range}
              refreshKey={refreshKey}
              onEdit={openBuilder}
            />
            {widgetGrid && <div className="px-5 pb-5">{widgetGrid}</div>}
          </div>
        ) : (
          <div className="p-5">{widgetGrid ?? emptyState}</div>
        )}
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

      <Dialog
        open={!!expanded}
        onOpenChange={(o) => !o && setExpandedId(null)}
      >
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
