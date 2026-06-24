"use client"

import * as React from "react"
import { Cell, Pie, PieChart } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { useGrouped } from "@/lib/insights/hooks"
import type { TimeRange, Widget } from "@/lib/insights/types"
import { cn } from "@/lib/utils"
import { WidgetShell, type WidgetControls } from "./widget-shell"

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

const config = { value: { label: "Calls" } } satisfies ChartConfig

// Donut + a real labeled legend (value + %) instead of floating leader-line numbers.
export function PieWidget({
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
  const field = widget.config.groupBy ?? "outcome"
  const { data, loading } = useGrouped(field, range, refreshKey)
  const total = data.reduce((a, d) => a + d.value, 0)
  // Display options from the builder (default on).
  const donut = widget.config.donut ?? true
  const percentages = widget.config.percentages ?? true
  const showLegend = widget.config.showLegend ?? true
  // Hovering a slice or its legend row highlights that segment and dims the rest.
  const [active, setActive] = React.useState<number | null>(null)

  return (
    <WidgetShell title={widget.title} owner={widget.owner} {...ctl}>
      {loading ? (
        <Skeleton className="h-[180px] w-full" />
      ) : (
        <div className="flex items-center gap-3">
          <ChartContainer config={config} className="aspect-square h-[170px]">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                outerRadius={78}
                innerRadius={donut ? 48 : 0}
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
          {showLegend && (
            <ul className="flex-1 space-y-1.5 text-xs">
              {data.map((d, i) => (
                <li
                  key={d.name}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  className={cn(
                    "flex cursor-default items-center gap-2 rounded px-1 py-0.5 transition-opacity",
                    active !== null && active !== i && "opacity-40"
                  )}
                >
                  <span
                    className="size-2.5 shrink-0 rounded-[2px]"
                    style={{ background: PALETTE[i % PALETTE.length] }}
                  />
                  <span className="truncate">{d.name}</span>
                  <span className="ml-auto tabular-nums text-muted-foreground">
                    {percentages
                      ? `${total ? Math.round((d.value / total) * 100) : 0}%`
                      : d.value}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </WidgetShell>
  )
}
