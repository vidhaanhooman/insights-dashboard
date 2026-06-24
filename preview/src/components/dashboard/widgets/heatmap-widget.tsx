"use client"

import * as React from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { useHeatmap } from "@/lib/insights/hooks"
import type { TimeRange, Widget } from "@/lib/insights/types"
import { WidgetShell, type WidgetControls } from "./widget-shell"

// Shade a cell from faint to solid blue based on its share of the max value.
function shade(value: number, max: number): string {
  const a = max ? 0.1 + 0.85 * (value / max) : 0.1
  return `rgba(58, 106, 230, ${a.toFixed(3)})`
}

export function HeatmapWidget({
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
  const { data, loading } = useHeatmap(range, refreshKey)

  return (
    <WidgetShell title={widget.title} owner={widget.owner} {...ctl}>
      {loading ? (
        <Skeleton className="h-full min-h-[180px] w-full" />
      ) : (
        // One grid that fills the card: rows + columns share the space, so
        // cells scale up/down as the widget is resized (no clipping/scroll).
        <div
          className="grid h-full gap-1"
          style={{
            gridTemplateColumns: `3.5rem repeat(${data.cols.length}, minmax(0, 1fr))`,
            gridTemplateRows: `auto repeat(${data.rows.length}, minmax(0, 1fr))`,
          }}
        >
          <span />
          {data.cols.map((c) => (
            <span
              key={c}
              className="self-center text-center text-[10px] text-text-muted"
            >
              {c}
            </span>
          ))}

          {data.rows.map((r) => (
            <React.Fragment key={r.label}>
              <span className="self-center truncate pr-1 text-[11px] tabular-nums text-text-muted">
                {r.label}
              </span>
              {r.cells.map((v, i) => (
                <div
                  key={i}
                  title={`${r.label} · ${data.cols[i]}: ${v} calls`}
                  className="min-h-0 rounded-[3px] transition-transform hover:scale-[1.06]"
                  style={{ background: shade(v, data.max) }}
                />
              ))}
            </React.Fragment>
          ))}
        </div>
      )}
    </WidgetShell>
  )
}
