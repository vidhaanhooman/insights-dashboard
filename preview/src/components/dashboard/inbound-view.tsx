"use client"

import {
  Clock,
  PhoneIncoming,
  Smile,
  Split,
  type LucideIcon,
} from "lucide-react"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useInboundSummary } from "@/lib/insights/hooks"
import { formatValue } from "@/lib/insights/resolver"
import type { TimeRange } from "@/lib/insights/types"

interface Stat {
  label: string
  value: string
  icon: LucideIcon
}

export function InboundView({
  range,
  refreshKey,
}: {
  range: TimeRange
  refreshKey: number
}) {
  const { data, loading } = useInboundSummary(range, refreshKey)

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3.5 p-5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[116px] w-full rounded-xl" />
        ))}
      </div>
    )
  }

  const stats: Stat[] = [
    { label: "Calls Received", icon: PhoneIncoming, value: formatValue(data.received, "count") },
    { label: "Avg Duration", icon: Clock, value: formatValue(data.avgDur, "duration") },
    { label: "Transfer Rate", icon: Split, value: formatValue(data.transferRate, "percent") },
    { label: "CSAT", icon: Smile, value: data.csat.toFixed(1) },
  ]

  return (
    <div className="grid grid-cols-2 gap-3.5 p-5 lg:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label} className="gap-0 p-4">
          <div className="flex items-center gap-1.5 text-sm font-medium text-text-muted">
            <s.icon size={15} className="shrink-0" />
            {s.label}
          </div>
          <p className="mt-3 text-3xl font-bold leading-none tabular-nums text-text">
            {s.value}
          </p>
        </Card>
      ))}
    </div>
  )
}
