"use client"

import { BarChartHorizontal } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { useGrouped } from "@/lib/insights/hooks"
import type { TimeRange } from "@/lib/insights/types"

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

const config = {
  value: { label: "Calls", color: "var(--chart-1)" },
} satisfies ChartConfig

// Enlarged view for a stat — the metric broken down by agent as horizontal bars.
export function MetricBreakdown({
  range,
  refreshKey,
  available = true,
}: {
  range: TimeRange
  refreshKey: number
  /** Some metrics (rates, durations, scores) don't break down by agent. */
  available?: boolean
}) {
  const { data, loading } = useGrouped("agent", range, refreshKey)

  if (loading) return <Skeleton className="h-[360px] w-full" />

  const total = data.reduce((sum, d) => sum + d.value, 0)
  const empty = data.length === 0 || total === 0

  if (!available || empty) {
    return (
      <div className="flex h-[360px] flex-col items-center justify-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-surface-2 text-text-muted">
          <BarChartHorizontal className="size-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-text">
            {available ? "No data to break down" : "Breakdown not available"}
          </p>
          <p className="max-w-xs text-xs text-text-muted">
            {available
              ? "There’s no data to chart for this metric in the selected range."
              : "This metric can’t be broken down by agent."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-text-muted">Breakdown by agent</p>
      <ChartContainer config={config} className="h-[360px] w-full">
        <BarChart
          accessibilityLayer
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 4 }}
        >
          <CartesianGrid horizontal={false} />
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            tickLine={false}
            axisLine={false}
            width={120}
            tickMargin={6}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  )
}
