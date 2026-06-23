"use client"

import * as React from "react"
import { Bar, BarChart, Cell, Pie, PieChart } from "recharts"
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
import { ChartToolbar } from "@/components/dashboard/chart-toolbar"
import { SegmentedToggle } from "@/components/dashboard/segmented-toggle"
import { MetricBreakdown } from "@/components/dashboard/widgets/metric-breakdown"
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

export interface Stat {
  label: string
  value: string
  icon: LucideIcon
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
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{expanded}</DialogTitle>
          </DialogHeader>
          <ChartToolbar />
          <MetricBreakdown range={range} refreshKey={refreshKey} />
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
  className,
  children,
  enlargedViews,
  onEdit,
  dialogClassName = "sm:max-w-4xl",
}: {
  title: string
  className?: string
  children: React.ReactNode
  /** Optional alternate views shown (with a toggle) in the enlarge dialog. */
  enlargedViews?: EnlargedView[]
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
          <span className="text-sm font-medium">{title}</span>
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
                <DropdownMenuItem
                  onSelect={() => (onEdit ? onEdit() : setOpen(true))}
                >
                  <SlidersHorizontal /> Edit…
                </DropdownMenuItem>
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
              {enlargedViews && enlargedViews.length > 1 && (
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
          <ChartToolbar />
          {activeView ? activeView.node : children}
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
  data,
  series,
  loading,
  onEdit,
}: {
  title: string
  data: Record<string, string | number>[]
  series: LineSeries[]
  loading?: boolean
  onEdit?: () => void
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
    <PanelCard title={title} onEdit={onEdit}>
      {loading ? (
        <Skeleton className="h-[260px] w-full" />
      ) : (
        <>
          <ChartContainer config={config} className="h-[260px] w-full">
            <LineChart data={data} margin={{ top: 8, right: 12, left: -12 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={24}
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
          <div className="mt-2 flex justify-center gap-2 text-xs">
            {series.map((s) => (
              <button
                key={s.key}
                onClick={() => isolate(s.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-opacity hover:bg-surface-2",
                  visible.has(s.key) ? "text-text-muted" : "opacity-40"
                )}
              >
                <span className="size-2 rounded-full" style={{ background: s.color }} />
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </PanelCard>
  )
}

export function PiePanel({
  title,
  data,
  loading,
  onEdit,
}: {
  title: string
  data: { name: string; value: number }[]
  loading?: boolean
  onEdit?: () => void
}) {
  const total = data.reduce((a, d) => a + d.value, 0)
  return (
    <PanelCard title={title} onEdit={onEdit} dialogClassName="sm:max-w-lg">
      {loading ? (
        <Skeleton className="mx-auto aspect-square max-h-[220px] w-[220px]" />
      ) : total === 0 ? (
        <div className="flex h-[220px] items-center justify-center text-sm text-text-muted">
          No data
        </div>
      ) : (
        <div className="flex h-full items-center justify-between gap-6 pr-4">
          <ChartContainer
            config={{ value: { label: "Calls" } } satisfies ChartConfig}
            className="aspect-square h-[200px]"
          >
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie data={data} dataKey="value" nameKey="name" outerRadius={84} stroke="0">
                {data.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <ul className="shrink-0 space-y-1.5 text-xs">
            {data.map((d, i) => (
              <li key={d.name} className="flex items-center gap-2.5">
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
              className={c.numeric ? "text-right" : undefined}
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
