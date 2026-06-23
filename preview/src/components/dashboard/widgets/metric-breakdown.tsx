"use client"

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
}: {
  range: TimeRange
  refreshKey: number
}) {
  const { data, loading } = useGrouped("agent", range, refreshKey)

  if (loading) return <Skeleton className="h-[360px] w-full" />

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
