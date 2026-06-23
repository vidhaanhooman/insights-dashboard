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
import { useScalar } from "@/lib/insights/hooks"
import { formatValue } from "@/lib/insights/resolver"
import type { Metric, MetricFormat, TimeRange, Widget } from "@/lib/insights/types"
import { StatBody } from "./stat-body"
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

  return (
    <WidgetShell title={widget.title} owner={widget.owner} {...ctl}>
      <StatBody
        icon={FORMAT_ICON[metric.format]}
        label={metric.label}
        value={formatValue(data.value, metric.format)}
        loading={loading}
        muted={!loading && data.value === 0}
        hero={hero}
      />
    </WidgetShell>
  )
}
