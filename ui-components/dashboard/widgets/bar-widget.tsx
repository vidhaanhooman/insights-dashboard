"use client"

import { Bar, BarChart, CartesianGrid, Cell, XAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { useGrouped } from "@/lib/insights/hooks"
import type { TimeRange, Widget } from "@/lib/insights/types"
import { WidgetShell, type WidgetControls } from "./widget-shell"

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

export function BarWidget({
  widget,
  range,
  refreshKey,
  ctl,
}: {
  widget: Widget
  range: TimeRange
  refreshKey: number
  ctl: WidgetControls
}) {
  const field = widget.config.groupBy ?? "agent"
  const { data, loading } = useGrouped(field, range, refreshKey)

  return (
    <WidgetShell title={widget.title} owner={widget.owner} {...ctl}>
      {loading ? (
        <Skeleton className="h-[200px] w-full" />
      ) : (
        <ChartContainer config={config} className="h-[200px] w-full">
          <BarChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="value" radius={4} maxBarSize={28}>
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </WidgetShell>
  )
}
