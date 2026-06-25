"use client"

import * as React from "react"
import { Bar, BarChart, Cell, LabelList, Pie, PieChart } from "recharts"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import {
  Bell,
  Download,
  Maximize2,
  MoreHorizontal,
  RefreshCw,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { useGrouped, useSeries } from "@/lib/insights/hooks"
import { ChartToolbar } from "@/components/dashboard/chart-toolbar"
import { FilterBuilder, type FilterRow } from "@/components/dashboard/filter-builder"
import {
  ChartDetail,
  RailColors,
  RailCombo,
  RailGroup,
  RailToggle,
  useChartColors,
} from "@/components/dashboard/chart-edit"
import { SegmentedToggle } from "@/components/dashboard/segmented-toggle"
import { MetricBreakdown } from "@/components/dashboard/widgets/metric-breakdown"
import { MetricDetail } from "@/components/dashboard/widgets/metric-detail"
import { StatBody } from "@/components/dashboard/widgets/stat-body"
import type { TimeRange } from "@/lib/insights/types"
import { cn } from "@/lib/utils"

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

// Hex equivalents of the chart palette — needed for the native color picker.
const PIE_HEX = ["#3a6ae6", "#6f9cf6", "#2546b3", "#a9caff", "#5f79c9"]

export interface Stat {
  label: string
  value: string
  icon: LucideIcon
  /** Whether an agent breakdown chart makes sense for this metric (counts yes; rates/durations no). */
  breakdown?: boolean
  /** Use the fuller 5-panel detail layout on enlarge. */
  fullDetail?: boolean
}

export function StatCards({
  items,
  range = "today",
  refreshKey = 0,
}: {
  items: Stat[]
  range?: TimeRange
  refreshKey?: number
}) {
  const [expanded, setExpanded] = React.useState<string | null>(null)
  const expandedStat = items.find((s) => s.label === expanded)
  // Counts → simple horizontal bar breakdown; rates/scores → full detail layout.
  const barOnly = expandedStat?.breakdown === true
  return (
    <>
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {items.map((s) => (
          <Card
            key={s.label}
            className="group relative flex flex-col gap-0 p-4"
          >
            <Button
              variant="ghost"
              size="icon"
              aria-label="Enlarge"
              onClick={() => setExpanded(s.label)}
              className="absolute right-3 top-3 size-7 text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Maximize2 className="size-3.5" />
            </Button>
            <StatBody icon={s.icon} label={s.label} value={s.value} />
          </Card>
        ))}
      </div>

      <Dialog open={!!expanded} onOpenChange={(o) => !o && setExpanded(null)}>
        <DialogContent
          className={cn(
            "max-h-[90vh] overflow-y-auto",
            barOnly ? "sm:max-w-3xl" : "sm:max-w-6xl"
          )}
        >
          <DialogHeader>
            <DialogTitle>{barOnly ? expanded : `${expanded} details`}</DialogTitle>
          </DialogHeader>
          <ChartToolbar />
          {barOnly ? (
            <MetricBreakdown range={range} refreshKey={refreshKey} />
          ) : (
            <MetricDetail
              label={expanded ?? ""}
              range={range}
              refreshKey={refreshKey}
              full={expandedStat?.fullDetail}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export interface EnlargedView {
  key: string
  label: string
  node: React.ReactNode
}

export function PanelCard({
  title,
  description,
  className,
  children,
  enlargedViews,
  enlargeContent,
  editContent,
  onEdit,
  dialogClassName = "sm:max-w-4xl",
}: {
  title: string
  /** Optional muted subtitle under the panel title. */
  description?: string
  className?: string
  children: React.ReactNode
  /** Optional alternate views shown (with a toggle) in the enlarge dialog. */
  enlargedViews?: EnlargedView[]
  /** Full custom body for the enlarge dialog (replaces the toolbar + chart). */
  enlargeContent?: React.ReactNode
  /** Body for the ⋯ → Edit dialog (the chart settings rail). */
  editContent?: React.ReactNode
  /** Opens the widget builder to configure this panel (fallback when no editContent). */
  onEdit?: () => void
  /** Width of the enlarge/edit dialog. */
  dialogClassName?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  // Bumping this re-mounts the panel content, re-running its data hooks/loading.
  const [nonce, setNonce] = React.useState(0)
  const [view, setView] = React.useState(enlargedViews?.[0]?.key ?? "")
  const activeView =
    enlargedViews?.find((v) => v.key === view) ?? enlargedViews?.[0]
  return (
    <>
      <Card className={cn("group gap-0 overflow-hidden py-0", className)}>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0 border-b px-5 py-3">
          <div className="min-w-0">
            <span className="block text-sm font-medium">{title}</span>
            {description && (
              <span className="mt-0.5 block truncate text-xs text-text-muted">
                {description}
              </span>
            )}
          </div>
          <div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-text-muted"
              aria-label="Refresh"
              onClick={() => setNonce((n) => n + 1)}
            >
              <RefreshCw className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-text-muted"
              aria-label="Enlarge"
              onClick={() => setOpen(true)}
            >
              <Maximize2 className="size-3.5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-text-muted"
                  aria-label="More actions"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={() => setNonce((n) => n + 1)}>
                  <RefreshCw /> Refresh
                </DropdownMenuItem>
                {(editContent || onEdit) && (
                  <DropdownMenuItem
                    onSelect={() =>
                      editContent ? setEditOpen(true) : onEdit?.()
                    }
                  >
                    <SlidersHorizontal /> Edit…
                  </DropdownMenuItem>
                )}
                {/* TODO(stub): wire up image export */}
                <DropdownMenuItem disabled>
                  <Download /> Download image
                </DropdownMenuItem>
                {/* TODO(stub): wire up alarm creation */}
                <DropdownMenuItem disabled>
                  <Bell /> Create alarm
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-4">
          <React.Fragment key={nonce}>{children}</React.Fragment>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={dialogClassName}>
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <DialogTitle>{title}</DialogTitle>
              {!enlargeContent && enlargedViews && enlargedViews.length > 1 && (
                <SegmentedToggle
                  size="sm"
                  value={activeView?.key ?? ""}
                  onChange={setView}
                  options={enlargedViews.map((v) => ({
                    value: v.key,
                    label: v.label,
                  }))}
                />
              )}
            </div>
          </DialogHeader>
          {enlargeContent ? (
            <div className="min-h-0 flex-1 overflow-hidden">{enlargeContent}</div>
          ) : (
            <>
              <ChartToolbar />
              {activeView ? activeView.node : children}
            </>
          )}
        </DialogContent>
      </Dialog>

      {editContent && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className={dialogClassName}>
            <DialogHeader>
              <DialogTitle>Edit · {title}</DialogTitle>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-hidden">{editContent}</div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

export interface LineSeries {
  key: string
  label: string
  color: string
}

export function LinePanel({
  title,
  description,
  data,
  series,
  loading,
  onEdit,
  fill,
  enlargeContent,
}: {
  title: string
  description?: string
  data: Record<string, string | number>[]
  series: LineSeries[]
  loading?: boolean
  onEdit?: () => void
  /** Stretch the chart to fill the card height (for tall, height-matched rows). */
  fill?: boolean
  /** Override the default enlarge view (LineDetail) with a richer deep dive. */
  enlargeContent?: React.ReactNode
}) {
  const config = Object.fromEntries(
    series.map((s) => [s.key, { label: s.label, color: s.color }])
  ) satisfies ChartConfig

  const [visible, setVisible] = React.useState<Set<string>>(
    () => new Set(series.map((s) => s.key))
  )
  // Click a series to isolate it; click the isolated one again to restore all.
  function isolate(key: string) {
    setVisible((prev) =>
      prev.size === 1 && prev.has(key)
        ? new Set(series.map((s) => s.key))
        : new Set([key])
    )
  }

  return (
    <PanelCard
      title={title}
      description={description}
      onEdit={onEdit}
      dialogClassName="flex h-[90vh] w-[94vw] max-w-[94vw] flex-col sm:max-w-[94vw]"
      editContent={loading ? undefined : <LineDetail data={data} series={series} />}
      enlargeContent={
        loading ? undefined : (enlargeContent ?? <LineDetailView data={data} series={series} />)
      }
    >
      {loading ? (
        <Skeleton className={cn("w-full", fill ? "h-full min-h-[240px]" : "h-[260px]")} />
      ) : (
        <div className="flex h-full flex-col">
          {/* Legend up top (dots under the title) — click to isolate a series. */}
          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {series.map((s) => (
              <button
                key={s.key}
                onClick={() => isolate(s.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md py-0.5 transition-opacity hover:opacity-80",
                  visible.has(s.key) ? "text-text-muted" : "opacity-40"
                )}
              >
                <span className="size-2 rounded-full" style={{ background: s.color }} />
                {s.label}
              </button>
            ))}
          </div>
          <ChartContainer
            config={config}
            className={cn(
              "w-full",
              fill ? "aspect-auto min-h-0 flex-1" : "h-[240px]"
            )}
          >
            <LineChart data={data} margin={{ top: 8, right: 12, left: -12 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                interval={0}
              />
              <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              {series
                .filter((s) => visible.has(s.key))
                .map((s) => (
                  <Line
                    key={s.key}
                    dataKey={s.key}
                    type="monotone"
                    stroke={`var(--color-${s.key})`}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
            </LineChart>
          </ChartContainer>
        </div>
      )}
    </PanelCard>
  )
}

/**
 * Interactive pie/donut: hovering a slice (or its legend row) lifts that
 * segment and dims the rest. Sized to a fixed square so it stays compact in
 * the card and scales up cleanly in the enlarge dialog.
 */
function Donut({
  data,
  total,
  donut,
  legend,
  size,
}: {
  data: { name: string; value: number }[]
  total: number
  donut?: boolean
  legend: "right" | "bottom"
  size: number
}) {
  const [active, setActive] = React.useState<number | null>(null)
  const stacked = legend === "bottom"

  return (
    <div
      className={cn(
        "flex gap-5",
        stacked
          ? "h-full flex-col items-center justify-center"
          : "h-full items-center justify-between pr-4"
      )}
    >
      <ChartContainer
        config={{ value: { label: "Calls" } } satisfies ChartConfig}
        // Responsive square — fills the card up to `size` and stays 1:1.
        className="mx-auto aspect-square w-full shrink-0"
        style={{ maxWidth: size, maxHeight: size }}
      >
        <PieChart>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius="92%"
            innerRadius={donut ? "62%" : "0%"}
            stroke="0"
            onMouseEnter={(_, i) => setActive(i)}
            onMouseLeave={() => setActive(null)}
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={PALETTE[i % PALETTE.length]}
                opacity={active === null || active === i ? 1 : 0.35}
              />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul
        className={cn(
          "text-xs",
          stacked
            ? "flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5"
            : "shrink-0 space-y-1.5"
        )}
      >
        {data.map((d, i) => (
          <li
            key={d.name}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            className={cn(
              "flex cursor-default items-center gap-2.5 rounded px-1 py-0.5 transition-opacity",
              active !== null && active !== i && "opacity-40"
            )}
          >
            <span
              className="size-2.5 shrink-0 rounded-[2px]"
              style={{ background: PALETTE[i % PALETTE.length] }}
            />
            <span>{d.name}</span>
            <span className="ml-2 tabular-nums text-text-muted">
              {Math.round((d.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const GROUP_OPTIONS = [
  { value: "outcome", label: "Outcome" },
  { value: "agent", label: "Agent" },
  { value: "callInfo.endReason", label: "End reason" },
  { value: "callInfo.from", label: "From" },
  { value: "callInfo.to", label: "To" },
  { value: "callInfo.attempt", label: "Attempt" },
]

// Small inline combobox for the query control bar.
function Combo({
  value,
  items,
  onChange,
  width = 150,
}: {
  value: string
  items: readonly string[]
  onChange: (v: string) => void
  width?: number
}) {
  return (
    <Combobox items={items} value={value} onValueChange={onChange}>
      <div style={{ width }}>
        <ComboboxInput placeholder="Select" />
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
      </div>
    </Combobox>
  )
}

// Tiny seeded sparkline for the grouped results table.
function Spark({ seed }: { seed: number }) {
  const pts = Array.from({ length: 14 }, (_, k) => {
    const r = Math.sin(seed * 13.1 + k * 7.3) * 43758.5453
    const v = r - Math.floor(r)
    return `${(k / 13) * 56 + 2},${16 - v * 13}`
  }).join(" ")
  return (
    <svg width="60" height="18" className="text-text-muted" aria-hidden>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

// Enlarge view — a "Run Query" explorer: controls + chart + grouped results.
function PieQueryView({
  data,
  donut: donutInit,
  range,
  refreshKey,
  groupBy: groupByInit,
}: {
  data: { name: string; value: number }[]
  donut?: boolean
  percentages?: boolean
  range?: TimeRange
  refreshKey?: number
  groupBy?: string
}) {
  const fieldByLabel = React.useMemo(
    () => Object.fromEntries(GROUP_OPTIONS.map((o) => [o.label, o.value])),
    []
  )
  const labelByField = React.useMemo(
    () => Object.fromEntries(GROUP_OPTIONS.map((o) => [o.value, o.label])),
    []
  )
  const donut = donutInit ?? true
  // Query config lives in the Edit view; the enlarge view renders the result.
  const measure = "Calls"
  const agg = "Sum"
  const groupLabel = labelByField[groupByInit ?? "outcome"] ?? "Outcome"
  const [granularity, setGranularity] = React.useState("5 minutes")
  const [chartType, setChartType] = React.useState("Bar")
  const [query, setQuery] = React.useState("")
  const { colorFor } = useChartColors(PIE_HEX)
  const [active, setActive] = React.useState<number | null>(null)

  const groupField = fieldByLabel[groupLabel] ?? "outcome"
  const live = useGrouped(groupField, range ?? "today", refreshKey ?? 0)
  const rows = range ? live.data : data
  const total = rows.reduce((a, d) => a + d.value, 0)
  const filtered = rows.filter((r) =>
    r.name.toLowerCase().includes(query.trim().toLowerCase())
  )

  // Deeper-dive data for the metric.
  const series = useSeries(range ?? "today", refreshKey ?? 0)
  const agentData = useGrouped("agent", range ?? "today", refreshKey ?? 0)
  const top = [...rows].sort((a, b) => b.value - a.value)[0]
  const tiles = [
    { label: `Total ${measure}`, value: total.toLocaleString() },
    { label: `${groupLabel} values`, value: String(rows.length) },
    {
      label: `Top ${groupLabel.toLowerCase()}`,
      value: top ? top.name : "—",
      sub: top && total ? `${Math.round((top.value / total) * 100)}%` : "",
    },
    {
      label: "Avg per value",
      value: rows.length ? Math.round(total / rows.length).toLocaleString() : "0",
    },
  ]

  const donutChart = (
    <ChartContainer config={{ value: { label: measure } } satisfies ChartConfig} className="mx-auto aspect-square h-full max-h-[320px] w-auto">
      <PieChart>
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Pie data={rows} dataKey="value" nameKey="name" outerRadius="82%" innerRadius={donut ? "56%" : "0%"} stroke="0" onMouseEnter={(_, i) => setActive(i)} onMouseLeave={() => setActive(null)}>
          {rows.map((_, i) => (
            <Cell key={i} fill={colorFor(i)} opacity={active === null || active === i ? 1 : 0.4} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )

  const barChart = (
    <ChartContainer config={{ value: { label: measure } } satisfies ChartConfig} className="h-[320px] w-full">
      <BarChart data={rows} margin={{ top: 8, right: 12, left: -12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={56}>
          {rows.map((_, i) => (
            <Cell key={i} fill={colorFor(i)} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )

  // The breakdown table doubles as the chart's legend (hover-linked).
  const breakdown = (list: typeof rows, withSearch: boolean) => (
    <div className="flex h-full flex-col">
      {withSearch && rows.length > 8 && (
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="mb-2 h-9"
        />
      )}
      <div className="flex items-center justify-between border-b border-border px-1 py-2 text-xs text-text-muted">
        <span>{groupLabel}</span>
        <span>{agg} of {measure}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {list.map((r) => {
          const i = rows.indexOf(r)
          return (
            <div
              key={r.name}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              className="flex items-center gap-3 border-b border-border/60 px-1 py-2 text-sm last:border-0 hover:bg-surface-2/40"
            >
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: colorFor(i) }} />
              <span className="min-w-0 flex-1 truncate text-text">{r.name}</span>
              <span className="text-text-muted">{Math.round((r.value / total) * 100)}%</span>
              <span className="w-10 text-right tabular-nums text-text">{r.value}</span>
              <Spark seed={i + 1} />
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
      {/* Summary tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl border border-border bg-card p-3">
            <p className="truncate text-xs text-text-muted">{t.label}</p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="truncate text-2xl font-semibold tracking-tight tabular-nums text-text">
                {t.value}
              </span>
              {t.sub && <span className="text-xs text-text-muted">{t.sub}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Result card — chart + breakdown side by side. */}
      <div className="rounded-xl border border-border">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          {chartType === "Bar" ? (
            <Combo value={granularity} items={["1 minute", "5 minutes", "30 minutes", "1 hour"]} onChange={setGranularity} width={130} />
          ) : (
            <span className="text-xs text-text-muted">
              {agg} of {measure} · {groupLabel.toLowerCase()}
            </span>
          )}
          <SegmentedToggle
            size="sm"
            value={chartType}
            onChange={setChartType}
            options={[
              { value: "Bar", label: "Bar" },
              { value: "Pie", label: "Pie" },
              { value: "Table", label: "Table" },
            ]}
          />
        </div>
        <div className="p-3">
          {chartType === "Table" ? (
            breakdown(filtered, true)
          ) : (
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="flex min-w-0 flex-1 items-center justify-center">
                {chartType === "Pie" ? donutChart : barChart}
              </div>
              <div className="w-full shrink-0 lg:w-80">{breakdown(rows, false)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Deeper dive — trend + secondary breakdown. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border p-4">
          <p className="mb-3 text-sm font-medium text-text">{measure} over time</p>
          <ChartContainer
            config={{ Attempted: { label: measure, color: "var(--chart-1)" } } satisfies ChartConfig}
            className="h-[220px] w-full"
          >
            <LineChart data={series.data} margin={{ top: 8, right: 12, left: -12 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} interval={0} />
              <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line dataKey="Attempted" type="monotone" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </div>

        <div className="rounded-xl border border-border p-4">
          <p className="mb-3 text-sm font-medium text-text">{measure} by agent</p>
          <ChartContainer
            config={{ value: { label: measure, color: "var(--chart-1)" } } satisfies ChartConfig}
            className="h-[220px] w-full"
          >
            <BarChart data={agentData.data} margin={{ top: 8, right: 12, left: -12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="value" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  )
}

// Edit view — the two-pane chart styling rail (Display / Data / Colors / Filters).
function PieEditView({
  data,
  donut: donutInit,
  percentages: pctInit,
  range,
  refreshKey,
  groupBy: groupByInit,
}: {
  data: { name: string; value: number }[]
  donut?: boolean
  percentages?: boolean
  range?: TimeRange
  refreshKey?: number
  groupBy?: string
}) {
  const fieldByLabel = React.useMemo(
    () => Object.fromEntries(GROUP_OPTIONS.map((o) => [o.label, o.value])),
    []
  )
  const labelByField = React.useMemo(
    () => Object.fromEntries(GROUP_OPTIONS.map((o) => [o.value, o.label])),
    []
  )
  const [donut, setDonut] = React.useState(donutInit ?? true)
  const [percentages, setPercentages] = React.useState(pctInit ?? true)
  const [showLegend, setShowLegend] = React.useState(false)
  const [measure, setMeasure] = React.useState("Calls")
  const [groupLabel, setGroupLabel] = React.useState(
    labelByField[groupByInit ?? "outcome"] ?? "Outcome"
  )
  const [show, setShow] = React.useState("All")
  const [timeRange, setTimeRange] = React.useState("Last 6 hours")
  const [showUngrouped, setShowUngrouped] = React.useState(false)
  const [filters, setFilters] = React.useState<FilterRow[]>([])
  const { colorFor, pick } = useChartColors(PIE_HEX)
  const [active, setActive] = React.useState<number | null>(null)

  const groupField = fieldByLabel[groupLabel] ?? "outcome"
  const live = useGrouped(groupField, range ?? "today", refreshKey ?? 0)
  const base = range ? live.data : data
  const chartData = show === "All" ? base : base.slice(0, show === "Top 5" ? 5 : 8)

  const RAD = Math.PI / 180
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderLabel = (p: any) => {
    const r = p.outerRadius + 16
    const x = p.cx + r * Math.cos(-p.midAngle * RAD)
    const y = p.cy + r * Math.sin(-p.midAngle * RAD)
    const txt = percentages
      ? `${p.name} ${Math.round(p.percent * 100)}%`
      : `${p.name} ${p.value}`
    return (
      <text x={x} y={y} textAnchor={x > p.cx ? "start" : "end"} dominantBaseline="central" fill="var(--text-dim)" fontSize={11}>
        {txt}
      </text>
    )
  }

  const chart = (
    <>
      <ChartContainer config={{ value: { label: measure } } satisfies ChartConfig} className="mx-auto aspect-square h-full max-h-[640px] w-auto">
        <PieChart>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Pie data={chartData} dataKey="value" nameKey="name" outerRadius="66%" innerRadius={donut ? "40%" : "0%"} stroke="0" label={renderLabel} labelLine={{ stroke: "var(--border-strong)" }} onMouseEnter={(_, i) => setActive(i)} onMouseLeave={() => setActive(null)}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={colorFor(i)} opacity={active === null || active === i ? 1 : 0.4} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      {showLegend && (
        <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
          {chartData.map((d, i) => (
            <li key={d.name} className="flex items-center gap-1.5 text-text-muted">
              <span className="size-2 rounded-full" style={{ background: colorFor(i) }} />
              {d.name}
            </li>
          ))}
        </ul>
      )}
    </>
  )

  return (
    <ChartDetail chart={chart}>
      <RailGroup label="Display">
        <RailToggle label="Display as donut" checked={donut} onChange={setDonut} />
        <RailToggle label="Display as percentages" checked={percentages} onChange={setPercentages} />
        <RailToggle label="Show legend" checked={showLegend} onChange={setShowLegend} />
      </RailGroup>
      <RailGroup label="Data">
        <RailCombo label="Measure" value={measure} onChange={setMeasure} items={["Calls", "Connected", "Pickup rate"]} />
        <RailCombo label="Aggregation" value="Sum" onChange={() => {}} items={["Sum", "Count", "Average", "Min", "Max"]} />
        <RailCombo label="Group by" value={groupLabel} onChange={setGroupLabel} items={GROUP_OPTIONS.map((o) => o.label)} />
        <RailCombo label="Time range" value={timeRange} onChange={setTimeRange} items={["Last 6 hours", "Last 24 hours", "Last 7 days", "Last 30 days"]} />
        <RailCombo label="Show" value={show} onChange={setShow} items={["All", "Top 5", "Top 8"]} />
        <RailToggle label="Show ungrouped" checked={showUngrouped} onChange={setShowUngrouped} />
      </RailGroup>
      <RailGroup label="Colors">
        <RailColors names={chartData.map((d) => d.name)} colorFor={colorFor} onPick={pick} />
      </RailGroup>
      <FilterBuilder filters={filters} onChange={setFilters} />
    </ChartDetail>
  )
}

// Expanded line view — multi-series line + Display / Data / Colors / Filters.
function LineDetail({
  data,
  series,
}: {
  data: Record<string, string | number>[]
  series: LineSeries[]
}) {
  const [showLegend, setShowLegend] = React.useState(true)
  const [curve, setCurve] = React.useState("Smooth")
  const [dots, setDots] = React.useState(false)
  const [measure, setMeasure] = React.useState("Calls")
  const [agg, setAgg] = React.useState("Sum")
  const [groupLabel, setGroupLabel] = React.useState("Outcome")
  const [timeRange, setTimeRange] = React.useState("Last 6 hours")
  const [show, setShow] = React.useState("All")
  const [showUngrouped, setShowUngrouped] = React.useState(false)
  const [filters, setFilters] = React.useState<FilterRow[]>([])
  const seriesHex = series.map((s) => s.color)
  const { colorFor, pick } = useChartColors(seriesHex)
  const config = Object.fromEntries(
    series.map((s, i) => [s.key, { label: s.label, color: colorFor(i) }])
  ) satisfies ChartConfig

  const chart = (
    <ChartContainer config={config} className="h-full max-h-[640px] w-full">
      <LineChart data={data} margin={{ top: 12, right: 16, left: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} interval={0} />
        <YAxis tickLine={false} axisLine={false} width={36} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {showLegend && <ChartLegend content={<ChartLegendContent />} />}
        {series.map((s, i) => (
          <Line
            key={s.key}
            dataKey={s.key}
            type={curve === "Smooth" ? "monotone" : "linear"}
            stroke={colorFor(i)}
            strokeWidth={2}
            dot={dots}
          />
        ))}
      </LineChart>
    </ChartContainer>
  )

  return (
    <ChartDetail chart={chart}>
      <RailGroup label="Display">
        <RailToggle label="Show legend" checked={showLegend} onChange={setShowLegend} />
        <RailToggle label="Show points" checked={dots} onChange={setDots} />
        <RailCombo
          label="Curve"
          value={curve}
          onChange={setCurve}
          items={["Smooth", "Straight"]}
        />
      </RailGroup>
      <RailGroup label="Data">
        <RailCombo label="Measure" value={measure} onChange={setMeasure} items={["Calls", "Connected", "Pickup rate"]} />
        <RailCombo label="Aggregation" value={agg} onChange={setAgg} items={["Sum", "Count", "Average", "Min", "Max"]} />
        <RailCombo label="Group by" value={groupLabel} onChange={setGroupLabel} items={GROUP_OPTIONS.map((o) => o.label)} />
        <RailCombo label="Time range" value={timeRange} onChange={setTimeRange} items={["Last 6 hours", "Last 24 hours", "Last 7 days", "Last 30 days"]} />
        <RailCombo label="Show" value={show} onChange={setShow} items={["All", "Top 5", "Top 8"]} />
        <RailToggle label="Show ungrouped" checked={showUngrouped} onChange={setShowUngrouped} />
      </RailGroup>
      <RailGroup label="Colors">
        <RailColors
          names={series.map((s) => s.label)}
          colorFor={colorFor}
          onPick={pick}
        />
      </RailGroup>
      <FilterBuilder filters={filters} onChange={setFilters} />
    </ChartDetail>
  )
}

// Expanded bar view — bars + Display / Data / Colors / Filters.
export function BarDetail({
  data,
}: {
  data: { name: string; value: number }[]
}) {
  const [horizontal, setHorizontal] = React.useState(false)
  const [showValues, setShowValues] = React.useState(false)
  const [sort, setSort] = React.useState("Descending")
  const [measure, setMeasure] = React.useState("Calls")
  const [agg, setAgg] = React.useState("Sum")
  const [groupLabel, setGroupLabel] = React.useState("Agent")
  const [timeRange, setTimeRange] = React.useState("Last 6 hours")
  const [show, setShow] = React.useState("All")
  const [showUngrouped, setShowUngrouped] = React.useState(false)
  const [filters, setFilters] = React.useState<FilterRow[]>([])
  const { colorFor, pick } = useChartColors(PIE_HEX)

  const rows = React.useMemo(() => {
    if (sort === "Default") return data
    const copy = [...data]
    copy.sort((a, b) => (sort === "Ascending" ? a.value - b.value : b.value - a.value))
    return copy
  }, [data, sort])

  const chart = (
    <ChartContainer
      config={{ value: { label: "Value", color: "var(--chart-1)" } } satisfies ChartConfig}
      className="h-full max-h-[640px] w-full"
    >
      <BarChart
        data={rows}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 12, right: 24, left: horizontal ? 8 : 0, bottom: 4 }}
        barCategoryGap="22%"
      >
        <CartesianGrid vertical={horizontal} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={96} />
          </>
        ) : (
          <>
            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} width={36} allowDecimals={false} />
          </>
        )}
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="value" radius={4} maxBarSize={48}>
          {rows.map((_, i) => (
            <Cell key={i} fill={colorFor(i)} />
          ))}
          {showValues && (
            <LabelList
              dataKey="value"
              position={horizontal ? "right" : "top"}
              className="fill-text-dim text-[11px]"
            />
          )}
        </Bar>
      </BarChart>
    </ChartContainer>
  )

  return (
    <ChartDetail chart={chart}>
      <RailGroup label="Display">
        <RailToggle label="Horizontal bars" checked={horizontal} onChange={setHorizontal} />
        <RailToggle label="Show values" checked={showValues} onChange={setShowValues} />
        <RailCombo
          label="Sort"
          value={sort}
          onChange={setSort}
          items={["Descending", "Ascending", "Default"]}
        />
      </RailGroup>
      <RailGroup label="Data">
        <RailCombo label="Measure" value={measure} onChange={setMeasure} items={["Calls", "Connected", "Pickup rate"]} />
        <RailCombo label="Aggregation" value={agg} onChange={setAgg} items={["Sum", "Count", "Average", "Min", "Max"]} />
        <RailCombo label="Group by" value={groupLabel} onChange={setGroupLabel} items={GROUP_OPTIONS.map((o) => o.label)} />
        <RailCombo label="Time range" value={timeRange} onChange={setTimeRange} items={["Last 6 hours", "Last 24 hours", "Last 7 days", "Last 30 days"]} />
        <RailCombo label="Show" value={show} onChange={setShow} items={["All", "Top 5", "Top 8"]} />
        <RailToggle label="Show ungrouped" checked={showUngrouped} onChange={setShowUngrouped} />
      </RailGroup>
      <RailGroup label="Colors">
        <RailColors
          names={rows.map((d) => d.name)}
          colorFor={colorFor}
          onPick={pick}
        />
      </RailGroup>
      <FilterBuilder filters={filters} onChange={setFilters} />
    </ChartDetail>
  )
}

// Details-only enlarge for a line panel — big chart + per-series stats + table.
// No config controls (those live in the Edit rail).
function StatTiles({ tiles }: { tiles: { label: string; value: string; sub?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-xl border border-border bg-card p-3">
          <p className="truncate text-xs text-text-muted">{t.label}</p>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="truncate text-2xl font-semibold tracking-tight tabular-nums text-text">
              {t.value}
            </span>
            {t.sub && <span className="text-xs text-text-muted">{t.sub}</span>}
          </p>
        </div>
      ))}
    </div>
  )
}

function LineDetailView({
  data,
  series,
}: {
  data: Record<string, string | number>[]
  series: LineSeries[]
}) {
  const config = Object.fromEntries(
    series.map((s) => [s.key, { label: s.label, color: s.color }])
  ) satisfies ChartConfig

  const tiles = series.map((s) => {
    const vals = data.map((d) => Number(d[s.key]) || 0)
    const total = vals.reduce((a, b) => a + b, 0)
    return { label: `Total ${s.label}`, value: total.toLocaleString(), sub: `peak ${Math.max(...vals, 0)}` }
  })
  const tableRows = data.filter((d) => String(d.label ?? "").trim() !== "")

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
      <StatTiles tiles={tiles} />
      <div className="rounded-xl border border-border p-4">
        <ChartContainer config={config} className="h-[340px] w-full">
          <LineChart data={data} margin={{ top: 12, right: 16, left: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} interval={0} />
            <YAxis tickLine={false} axisLine={false} width={36} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {series.map((s) => (
              <Line key={s.key} dataKey={s.key} type="monotone" stroke={s.color} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ChartContainer>
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-text-muted">
              <th className="px-4 py-2 font-medium">Period</th>
              {series.map((s) => (
                <th key={s.key} className="px-4 py-2 text-right font-medium">{s.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((d, i) => (
              <tr key={i} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-2 text-text">{String(d.label)}</td>
                {series.map((s) => (
                  <td key={s.key} className="px-4 py-2 text-right tabular-nums text-text-muted">
                    {Number(d[s.key]) || 0}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Details-only enlarge for a bar panel — big chart + breakdown table. No config.
export function BarDetailView({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((a, d) => a + d.value, 0)
  const sorted = [...data].sort((a, b) => b.value - a.value)
  const top = sorted[0]
  const tiles = [
    { label: "Total", value: total.toLocaleString() },
    { label: "Categories", value: String(data.length) },
    { label: "Top", value: top ? top.name : "—", sub: top && total ? `${Math.round((top.value / total) * 100)}%` : "" },
    { label: "Average", value: data.length ? Math.round(total / data.length).toLocaleString() : "0" },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
      <StatTiles tiles={tiles} />
      <div className="rounded-xl border border-border p-4">
        <ChartContainer
          config={{ value: { label: "Calls", color: "var(--chart-1)" } } satisfies ChartConfig}
          className="h-[340px] w-full"
        >
          <BarChart data={sorted} margin={{ top: 12, right: 24, left: 0 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} width={36} allowDecimals={false} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {sorted.map((_, i) => (
                <Cell key={i} fill={PIE_HEX[i % PIE_HEX.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-text-muted">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 text-right font-medium">Calls</th>
              <th className="px-4 py-2 text-right font-medium">Share</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d, i) => (
              <tr key={i} className="border-b border-border/60 last:border-0">
                <td className="flex items-center gap-2 px-4 py-2 text-text">
                  <span className="size-2.5 rounded-full" style={{ background: PIE_HEX[i % PIE_HEX.length] }} />
                  {d.name}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-text-muted">{d.value}</td>
                <td className="px-4 py-2 text-right tabular-nums text-text-muted">
                  {total ? Math.round((d.value / total) * 100) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function PiePanel({
  title,
  description,
  data,
  loading,
  onEdit,
  donut,
  legend = "right",
  square,
  range,
  refreshKey,
  groupBy,
}: {
  title: string
  description?: string
  data: { name: string; value: number }[]
  loading?: boolean
  onEdit?: () => void
  /** Render as a donut (hollow center) instead of a full pie. */
  donut?: boolean
  /** Where the legend sits relative to the chart. */
  legend?: "right" | "bottom"
  /** Constrain the card to a square box (chart stays compact). */
  square?: boolean
  /** Pass these so the enlarge view's "Group by" can re-query live. */
  range?: TimeRange
  refreshKey?: number
  groupBy?: string
}) {
  const stacked = legend === "bottom"
  const total = data.reduce((a, d) => a + d.value, 0)

  const empty = (
    <div className="flex h-[200px] items-center justify-center text-sm text-text-muted">
      No data
    </div>
  )

  return (
    <PanelCard
      title={title}
      description={description}
      onEdit={onEdit}
      className={square ? "aspect-square w-full" : undefined}
      dialogClassName="flex h-[90vh] w-[94vw] max-w-[94vw] flex-col sm:max-w-[94vw]"
      enlargeContent={
        total > 0 ? (
          <PieQueryView
            data={data}
            donut={donut}
            range={range}
            refreshKey={refreshKey}
            groupBy={groupBy}
          />
        ) : undefined
      }
      editContent={
        total > 0 ? (
          <PieEditView
            data={data}
            donut={donut}
            range={range}
            refreshKey={refreshKey}
            groupBy={groupBy}
          />
        ) : undefined
      }
    >
      {loading ? (
        <Skeleton className="mx-auto aspect-square max-h-[200px] w-[200px]" />
      ) : total === 0 ? (
        empty
      ) : (
        <Donut
          data={data}
          total={total}
          donut={donut}
          legend={legend}
          size={stacked ? 180 : 188}
        />
      )}
    </PanelCard>
  )
}

export interface Column {
  key: string
  label: string
  numeric?: boolean
}

export function TablePanel({
  title,
  columns,
  rows,
  loading,
  onEdit,
}: {
  title: string
  columns: Column[]
  rows: Record<string, string | number>[]
  loading?: boolean
  onEdit?: () => void
}) {
  const tableNode = loading ? (
    <div className="space-y-2 p-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-7 w-full" />
      ))}
    </div>
  ) : (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((c) => (
            <TableHead
              key={c.key}
              className={cn("first:pl-5 last:pr-5", c.numeric && "text-right")}
            >
              {c.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={i}>
            {columns.map((c) => (
              <TableCell
                key={c.key}
                className={cn(
                  "first:pl-5 last:pr-5",
                  c.numeric && "text-right tabular-nums",
                  c.key === columns[0].key && "font-medium"
                )}
              >
                {row[c.key]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  // Chart view for the enlarge toggle: first numeric column by the first column.
  const labelKey = columns[0].key
  const valueCol = columns.find((c) => c.numeric)
  const chartNode = valueCol ? (
    <ChartContainer
      config={
        { [valueCol.key]: { label: valueCol.label, color: "var(--chart-1)" } } satisfies ChartConfig
      }
      className="h-[360px] w-full"
    >
      <BarChart data={rows} margin={{ top: 8, right: 12, left: -12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey={labelKey} tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={36} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          dataKey={valueCol.key}
          fill="var(--chart-1)"
          radius={[4, 4, 0, 0]}
          maxBarSize={48}
        />
      </BarChart>
    </ChartContainer>
  ) : null

  return (
    <PanelCard
      title={title}
      className="[&>div:last-child]:p-0"
      onEdit={onEdit}
      enlargedViews={
        chartNode
          ? [
              { key: "table", label: "Table", node: tableNode },
              { key: "chart", label: "Chart", node: chartNode },
            ]
          : undefined
      }
    >
      {tableNode}
    </PanelCard>
  )
}
