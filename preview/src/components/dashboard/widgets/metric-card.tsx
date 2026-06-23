"use client"

import {
  Clock,
  DollarSign,
  Hash,
  Percent,
  Settings2,
  Sigma,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useScalar } from "@/lib/insights/hooks"
import { formatValue } from "@/lib/insights/resolver"
import type { Metric, MetricFormat, TimeRange, Widget } from "@/lib/insights/types"
import { cn } from "@/lib/utils"
import { WidgetShell, type WidgetControls } from "./widget-shell"

const FORMAT_ICON: Record<MetricFormat, LucideIcon> = {
  count: Hash,
  percent: Percent,
  ratio: Sigma,
  duration: Clock,
  currency: DollarSign,
}

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
        <div className="flex flex-col items-start gap-2">
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
  const Icon = FORMAT_ICON[metric.format]
  const isZero = !loading && data.value === 0

  return (
    <WidgetShell title={widget.title} owner={widget.owner} {...ctl}>
      <div className="flex items-center gap-1.5 text-sm font-medium text-text-muted">
        <Icon size={15} className="shrink-0" />
        <span className="truncate">{metric.label}</span>
      </div>
      {loading ? (
        <Skeleton className={cn("mt-3", hero ? "h-14 w-40" : "h-12 w-32")} />
      ) : (
        <p
          className={cn(
            "mt-3 font-bold leading-none tabular-nums",
            hero ? "text-6xl" : "text-5xl",
            isZero && "text-text-muted"
          )}
        >
          {formatValue(data.value, metric.format)}
        </p>
      )}
    </WidgetShell>
  )
}
