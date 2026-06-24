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
import { useGrouped } from "@/lib/insights/hooks"
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
  /** Opens the widget builder to configure this panel. */
  onEdit?: () => void
  /** Width of the enlarge dialog. */
  dialogClassName?: string
}) {
  const [open, setOpen] = React.useState(false)
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
                {onEdit && (
                  <DropdownMenuItem onSelect={onEdit}>
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
}: {
  title: string
  description?: string
  data: Record<string, string | number>[]
  series: LineSeries[]
  loading?: boolean
  onEdit?: () => void
  /** Stretch the chart to fill the card height (for tall, height-matched rows). */
  fill?: boolean
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
      enlargeContent={
        loading ? undefined : <LineDetail data={data} series={series} />
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

// Expanded pie view — big labelled chart + editable rail (Display / Data /
// Colors / Filters). Group by + Show actually re-query the chart.
function PieDetail({
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
  const [showUngrouped, setShowUngrouped] = React.useState(false)
  const [filters, setFilters] = React.useState<FilterRow[]>([])
  const { colorFor, pick } = useChartColors(PIE_HEX)
  const [active, setActive] = React.useState<number | null>(null)

  const groupField = fieldByLabel[groupLabel] ?? "outcome"
  const live = useGrouped(groupField, range ?? "today", refreshKey ?? 0)
  const base = range ? live.data : data
  const chartData =
    show === "All" ? base : base.slice(0, show === "Top 5" ? 5 : 8)

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
      <text
        x={x}
        y={y}
        textAnchor={x > p.cx ? "start" : "end"}
        dominantBaseline="central"
        fill="var(--text-dim)"
        fontSize={11}
      >
        {txt}
      </text>
    )
  }

  const chart = (
    <>
      <ChartContainer
        config={{ value: { label: measure } } satisfies ChartConfig}
        className="mx-auto aspect-square h-full max-h-[640px] w-auto"
      >
        <PieChart>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            outerRadius="66%"
            innerRadius={donut ? "40%" : "0%"}
            stroke="0"
            label={renderLabel}
            labelLine={{ stroke: "var(--border-strong)" }}
            onMouseEnter={(_, i) => setActive(i)}
            onMouseLeave={() => setActive(null)}
          >
            {chartData.map((_, i) => (
              <Cell
                key={i}
                fill={colorFor(i)}
                opacity={active === null || active === i ? 1 : 0.4}
              />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      {showLegend && (
        <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
          {chartData.map((d, i) => (
            <li key={d.name} className="flex items-center gap-1.5 text-text-muted">
              <span
                className="size-2 rounded-full"
                style={{ background: colorFor(i) }}
              />
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
        <RailToggle
          label="Display as percentages"
          checked={percentages}
          onChange={setPercentages}
        />
        <RailToggle label="Show legend" checked={showLegend} onChange={setShowLegend} />
      </RailGroup>

      <RailGroup label="Data">
        <RailCombo
          label="Measure"
          value={measure}
          onChange={setMeasure}
          items={["Calls", "Connected"]}
        />
        <RailCombo
          label="Group by"
          value={groupLabel}
          onChange={setGroupLabel}
          items={GROUP_OPTIONS.map((o) => o.label)}
        />
        <RailCombo
          label="Show"
          value={show}
          onChange={setShow}
          items={["All", "Top 5", "Top 8"]}
        />
        <RailToggle
          label="Show ungrouped"
          checked={showUngrouped}
          onChange={setShowUngrouped}
        />
      </RailGroup>

      <RailGroup label="Colors">
        <RailColors
          names={chartData.map((d) => d.name)}
          colorFor={colorFor}
          onPick={pick}
        />
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
          <PieDetail
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
