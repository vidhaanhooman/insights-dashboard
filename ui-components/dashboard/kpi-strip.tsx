"use client"

import {
  ListChecks,
  PhoneIncoming,
  PhoneOutgoing,
  type LucideIcon,
} from "lucide-react"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useKpiSummary } from "@/lib/insights/hooks"
import { formatValue } from "@/lib/insights/resolver"
import type { TimeRange } from "@/lib/insights/types"

interface Stat {
  label: string
  value: string
}
interface Group {
  channel: string
  icon: LucideIcon
  stats: Stat[]
}

export function KpiStrip({
  range,
  refreshKey,
}: {
  range: TimeRange
  refreshKey: number
}) {
  const { data, loading } = useKpiSummary(range, refreshKey)

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[84px] w-full rounded-lg" />
        ))}
      </div>
    )
  }

  const groups: Group[] = [
    {
      channel: "Inbound",
      icon: PhoneIncoming,
      stats: [
        { label: "Calls", value: formatValue(data.inbound.calls, "count") },
        { label: "Avg Duration", value: formatValue(data.inbound.avgDur, "duration") },
      ],
    },
    {
      channel: "Outbound",
      icon: PhoneOutgoing,
      stats: [
        { label: "Calls", value: formatValue(data.outbound.calls, "count") },
        { label: "Avg Duration", value: formatValue(data.outbound.avgDur, "duration") },
      ],
    },
    {
      channel: "Tasks",
      icon: ListChecks,
      stats: [
        { label: "Created", value: formatValue(data.tasks.created, "count") },
        { label: "Running", value: formatValue(data.tasks.running, "count") },
      ],
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
      {groups.map((g) => (
        <Card key={g.channel} className="gap-0 p-4">
          <div className="flex items-center gap-1.5 text-sm font-medium text-text-muted">
            <g.icon size={15} />
            {g.channel}
          </div>
          <div className="mt-3 flex items-end justify-between gap-4">
            {g.stats.map((s) => (
              <div key={s.label}>
                <p className="text-xs text-text-muted">{s.label}</p>
                <p className="mt-1 text-2xl font-bold leading-none tabular-nums text-text">
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}
