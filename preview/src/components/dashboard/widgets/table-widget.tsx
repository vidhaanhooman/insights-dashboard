"use client"

import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAgentTable } from "@/lib/insights/hooks"
import { formatValue } from "@/lib/insights/resolver"
import type { TimeRange, Widget } from "@/lib/insights/types"
import { WidgetShell, type WidgetControls } from "./widget-shell"

export function TableWidget({
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
  const { data, loading } = useAgentTable(range, refreshKey)

  return (
    <WidgetShell title={widget.title} owner={widget.owner} {...ctl} pad={false}>
      {loading ? (
        <div className="space-y-2 p-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full" />
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead className="text-right">Calls</TableHead>
              <TableHead className="text-right">Connected</TableHead>
              <TableHead className="text-right">Pickup</TableHead>
              <TableHead className="text-right">Avg dur</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((r) => (
              <TableRow key={r.agent} className="border-border-strong">
                <TableCell className="font-medium">{r.agent}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.calls}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.connected}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatValue(r.pickup, "percent")}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatValue(r.avgdur, "duration")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </WidgetShell>
  )
}
