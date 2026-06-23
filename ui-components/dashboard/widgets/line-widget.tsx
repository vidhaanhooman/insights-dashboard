"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { useMetricSeries } from "@/lib/insights/hooks"
import type { Metric, TimeRange, Widget } from "@/lib/insights/types"
import { WidgetShell, type WidgetControls } from "./widget-shell"

export function LineWidget({
  widget,
  metric,
  range,
  refreshKey,
  ctl,
}: {
  widget: Widget
  metric?: Metric
  range: TimeRange
  refreshKey: number
  ctl: WidgetControls
}) {
  const { data, loading } = useMetricSeries(metric, range, refreshKey)

  const config = {
    value: { label: metric?.label ?? "Value", color: "var(--chart-1)" },
  } satisfies ChartConfig

  return (
    <WidgetShell title={widget.title} owner={widget.owner} {...ctl}>
      {loading ? (
        <Skeleton className="h-[200px] w-full" />
      ) : (
        <ChartContainer config={config} className="h-[200px] w-full">
          <LineChart data={data} margin={{ top: 6, right: 8, left: -16 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval="preserveStartEnd"
            />
            <YAxis tickLine={false} axisLine={false} width={36} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              dataKey="value"
              name={metric?.label ?? "Value"}
              type="monotone"
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      )}
    </WidgetShell>
  )
}
