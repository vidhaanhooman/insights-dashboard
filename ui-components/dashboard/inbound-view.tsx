"use client"

import { Clock, PhoneIncoming, Star, Split } from "lucide-react"

import {
  useGrouped,
  useInboundAgentTable,
  useInboundSeries,
  useInboundSummary,
} from "@/lib/insights/hooks"
import { formatValue } from "@/lib/insights/resolver"
import type { TimeRange } from "@/lib/insights/types"
import { LinePanel, PiePanel, StatCards, TablePanel } from "./views/panels"

export function InboundView({
  range,
  refreshKey,
  onEdit,
}: {
  range: TimeRange
  refreshKey: number
  onEdit?: () => void
}) {
  const summary = useInboundSummary(range, refreshKey)
  const series = useInboundSeries(range, refreshKey)
  const outcome = useGrouped("outcome", range, refreshKey)
  const agents = useInboundAgentTable(range, refreshKey)

  const d = summary.data
  const stats = [
    { label: "Calls Received", icon: PhoneIncoming, value: formatValue(d.received, "count"), breakdown: true },
    { label: "Avg Duration", icon: Clock, value: formatValue(d.avgDur, "duration"), breakdown: false },
    { label: "Transfer Rate", icon: Split, value: formatValue(d.transferRate, "percent"), breakdown: false },
    { label: "CSAT", icon: Star, value: d.csat.toFixed(1), breakdown: false },
  ]

  return (
    <div className="space-y-3.5 p-5">
      <StatCards items={stats} range={range} refreshKey={refreshKey} />

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LinePanel
            onEdit={onEdit}
            title="Calls & Transfers"
            loading={series.loading}
            data={series.data}
            series={[
              { key: "Calls", label: "Calls", color: "var(--chart-1)" },
              { key: "Transfers", label: "Transfers", color: "var(--chart-2)" },
            ]}
          />
        </div>
        <PiePanel
          onEdit={onEdit}
          title="Outcome Wise Calls"
          loading={outcome.loading}
          data={outcome.data}
        />
      </div>

      <TablePanel
        onEdit={onEdit}
        title="Agent Wise Data"
        loading={agents.loading}
        columns={[
          { key: "agent", label: "Agent" },
          { key: "calls", label: "Calls", numeric: true },
          { key: "transferred", label: "Transferred Calls", numeric: true },
          { key: "transferRate", label: "Transfer Rate (%)", numeric: true },
          { key: "avgDur", label: "Avg Duration (s)", numeric: true },
        ]}
        rows={agents.data}
      />
    </div>
  )
}
