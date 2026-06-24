"use client"

import type { Metric, TimeRange, Widget } from "@/lib/insights/types"
import { BarWidget } from "./bar-widget"
import { HeatmapWidget } from "./heatmap-widget"
import { LineWidget } from "./line-widget"
import { MetricCard } from "./metric-card"
import { PieWidget } from "./pie-widget"
import { TableWidget } from "./table-widget"
import type { WidgetControls } from "./widget-shell"

interface WidgetRendererProps {
  widget: Widget
  metricsById: Record<string, Metric>
  range: TimeRange
  refreshKey: number
  ctl: WidgetControls
  onConfigure?: () => void
  hero?: boolean
}

export function WidgetRenderer({
  widget,
  metricsById,
  range,
  refreshKey,
  ctl,
  onConfigure,
  hero,
}: WidgetRendererProps) {
  const metric = metricsById[widget.metricIds[0]]
  const shared = { widget, range, refreshKey, ctl }

  switch (widget.type) {
    case "number":
      return (
        <MetricCard
          {...shared}
          metric={metric}
          onConfigure={onConfigure}
          hero={hero}
        />
      )
    case "line":
      return <LineWidget {...shared} metric={metric} />
    case "bar":
      return <BarWidget {...shared} />
    case "pie":
      return <PieWidget {...shared} />
    case "table":
      return <TableWidget {...shared} />
    case "heatmap":
      return <HeatmapWidget {...shared} />
    default:
      return null
  }
}
