"use client"

import { Clock, PhoneOutgoing, Percent, PhoneCall } from "lucide-react"

import {
  useAgentTable,
  useGrouped,
  useOutboundSummary,
  useSeries,
} from "@/lib/insights/hooks"
import { formatValue } from "@/lib/insights/resolver"
import type { TimeRange } from "@/lib/insights/types"
import { LinePanel, PiePanel, StatCards, TablePanel } from "./views/panels"

export function OutboundView({
  range,
  refreshKey,
  onEdit,
}: {
  range: TimeRange
  refreshKey: number
  onEdit?: () => void
}) {
  const summary = useOutboundSummary(range, refreshKey)
  const series = useSeries(range, refreshKey)
  const outcome = useGrouped("outcome", range, refreshKey)
  const endReason = useGrouped("callInfo.endReason", range, refreshKey)
  const agents = useAgentTable(range, refreshKey)

  const d = summary.data
  const stats = [
    { label: "Calls Attempted", icon: PhoneOutgoing, value: formatValue(d.attempted, "count") },
    { label: "Calls Connected", icon: PhoneCall, value: formatValue(d.connected, "count") },
    { label: "Avg Duration", icon: Clock, value: formatValue(d.avgDur, "duration") },
    { label: "Pickup Rate", icon: Percent, value: formatValue(d.pickup, "percent") },
  ]

  return (
    <div className="space-y-3.5 p-5">
      <StatCards items={stats} range={range} refreshKey={refreshKey} />

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LinePanel
            onEdit={onEdit}
            title="Calls Attempted & Connected"
            loading={series.loading}
            data={series.data}
            series={[
              { key: "Attempted", label: "Attempted", color: "var(--chart-1)" },
              { key: "Connected", label: "Connected", color: "var(--chart-2)" },
            ]}
          />
        </div>
        <PiePanel
          onEdit={onEdit}
          title="Outcome Wise Connected Calls"
          loading={outcome.loading}
          data={outcome.data}
        />
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        <PiePanel
          onEdit={onEdit}
          title="End Reason Wise Count"
          loading={endReason.loading}
          data={endReason.data}
        />
        <div className="lg:col-span-2">
          <TablePanel
            onEdit={onEdit}
            title="Agent Wise Data"
            loading={agents.loading}
            columns={[
              { key: "agent", label: "Agent" },
              { key: "calls", label: "Calls", numeric: true },
              { key: "connected", label: "Connected", numeric: true },
              { key: "pickup", label: "Pickup Rate (%)", numeric: true },
              { key: "avgdur", label: "Avg Duration (s)", numeric: true },
            ]}
            rows={agents.data}
          />
        </div>
      </div>
    </div>
  )
}
