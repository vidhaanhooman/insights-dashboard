"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { useSeries } from "@/lib/insights/hooks"
import type { TimeRange, Widget } from "@/lib/insights/types"
import { WidgetShell, type WidgetControls } from "./widget-shell"

const config = {
  Attempted: { label: "Attempted", color: "var(--chart-1)" },
  Connected: { label: "Connected", color: "var(--chart-2)" },
} satisfies ChartConfig

export function LineWidget({
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
  const { data, loading } = useSeries(range, refreshKey)

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
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              dataKey="Attempted"
              type="monotone"
              stroke="var(--color-Attempted)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="Connected"
              type="monotone"
              stroke="var(--color-Connected)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      )}
    </WidgetShell>
  )
}
