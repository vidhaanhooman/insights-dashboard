"use client"

import { Settings2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useScalar } from "@/lib/insights/hooks"
import { formatValue } from "@/lib/insights/resolver"
import type { Metric, TimeRange, Widget } from "@/lib/insights/types"
import { cn } from "@/lib/utils"
import { WidgetShell, type WidgetControls } from "./widget-shell"

interface MetricCardProps {
  widget: Widget
  metric?: Metric
  range: TimeRange
  refreshKey: number
  ctl: WidgetControls
  onConfigure?: () => void
  hero?: boolean
}

export function MetricCard(props: MetricCardProps) {
  if (!props.metric) {
    return (
      <WidgetShell
        title={props.widget.title}
        owner={props.widget.owner}
        {...props.ctl}
      >
        <div className="flex h-full flex-col items-start justify-center gap-2">
          <span className="text-sm text-text-muted">No metric configured</span>
          <Button size="sm" variant="outline" onClick={props.onConfigure}>
            <Settings2 /> Set up
          </Button>
        </div>
      </WidgetShell>
    )
  }
  return <ReadyMetricCard {...props} metric={props.metric} />
}

function ReadyMetricCard({
  widget,
  metric,
  range,
  refreshKey,
  ctl,
  hero = false,
}: MetricCardProps & { metric: Metric }) {
  const { data, loading } = useScalar(metric, range, refreshKey)
  const isZero = !loading && data.value === 0

  return (
    <WidgetShell title={widget.title} owner={widget.owner} {...ctl}>
      <div className="flex h-full items-center">
        {loading ? (
          <Skeleton className={hero ? "h-11 w-36" : "h-9 w-28"} />
        ) : (
          <span
            className={cn(
              "font-bold leading-none tabular-nums",
              hero ? "text-5xl" : "text-4xl",
              isZero && "text-text-muted"
            )}
          >
            {formatValue(data.value, metric.format)}
          </span>
        )}
      </div>
    </WidgetShell>
  )
}
