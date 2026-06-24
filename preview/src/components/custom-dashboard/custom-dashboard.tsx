"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"
import { Pencil, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { LinePanel, PanelCard, PiePanel } from "@/components/dashboard/views/panels"
import {
  useConversations,
  useGrouped,
  useKpiSummary,
  usePickupByTime,
  useSeries,
} from "@/lib/insights/hooks"
import { formatValue } from "@/lib/insights/resolver"
import type { TimeRange } from "@/lib/insights/types"

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

const CONVO_SERIES = [
  { key: "Inbound", label: "Inbound", color: "#3a6ae6" },
  { key: "Outbound", label: "Outbound", color: "#6f9cf6" },
  { key: "Web", label: "Web", color: "#2546b3" },
  { key: "Tasks", label: "Tasks created", color: "#a9caff" },
]

function StatBlock({
  range,
  refreshKey,
}: {
  range: TimeRange
  refreshKey: number
}) {
  const { data, loading } = useKpiSummary(range, refreshKey)

  const cards = loading
    ? []
    : [
        { label: "Inbound Calls", value: formatValue(data.inbound.calls, "count") },
        { label: "Outbound Calls", value: formatValue(data.outbound.calls, "count") },
        { label: "Tasks Created", value: formatValue(data.tasks.created, "count") },
        {
          label: "Total Calls",
          value: formatValue(data.inbound.calls + data.outbound.calls, "count"),
        },
      ]

  return (
    <div className="grid grid-cols-2 gap-4 self-start">
      {loading
        ? Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[92px] w-full rounded-xl" />
          ))
        : cards.map((c) => (
            <div
              key={c.label}
              className="rounded-xl border border-border bg-card p-4"
            >
              <p className="text-sm text-text-muted">{c.label}</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums text-text">
                {c.value}
              </p>
            </div>
          ))}
    </div>
  )
}

function AgentBarPanel({
  range,
  refreshKey,
}: {
  range: TimeRange
  refreshKey: number
}) {
  const { data, loading } = useGrouped("agent", range, refreshKey)
  const config = {
    value: { label: "Calls", color: "var(--chart-1)" },
  } satisfies ChartConfig

  return (
    <PanelCard title="Calls by agent">
      {loading ? (
        <Skeleton className="h-[240px] w-full" />
      ) : (
        <ChartContainer config={config} className="h-[240px] w-full">
          <BarChart data={data} margin={{ top: 8, right: 12, left: -12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={44}>
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </PanelCard>
  )
}

function ConversationsPanel({ range, refreshKey }: { range: TimeRange; refreshKey: number }) {
  const { data, loading } = useConversations(range, refreshKey)
  return (
    <LinePanel
      title="Conversations & Tasks"
      description="Daily volume across channels"
      loading={loading}
      data={data}
      series={CONVO_SERIES}
    />
  )
}

function CallsPanel({ range, refreshKey }: { range: TimeRange; refreshKey: number }) {
  const { data, loading } = useSeries(range, refreshKey)
  return (
    <LinePanel
      title="Calls attempted & connected"
      description="Attempts vs. connections over time"
      loading={loading}
      data={data}
      series={[
        { key: "Attempted", label: "Attempted", color: "var(--chart-1)" },
        { key: "Connected", label: "Connected", color: "var(--chart-2)" },
      ]}
    />
  )
}

function OutcomePanel({ range, refreshKey }: { range: TimeRange; refreshKey: number }) {
  const { data, loading } = useGrouped("outcome", range, refreshKey)
  return (
    <PiePanel
      title="Outcome breakdown"
      description="Share of calls by outcome"
      loading={loading}
      data={data}
      donut
      legend="bottom"
    />
  )
}

function PickupPanel({ range, refreshKey }: { range: TimeRange; refreshKey: number }) {
  const { data, loading } = usePickupByTime(range, refreshKey)
  return (
    <LinePanel
      title="Pickup rate over time"
      description="Connected share by hour of day"
      loading={loading}
      data={data}
      series={[{ key: "value", label: "Pickup rate", color: "var(--chart-1)" }]}
    />
  )
}

export function CustomDashboard() {
  const [range] = React.useState<TimeRange>("7d")
  const [refreshKey, setRefreshKey] = React.useState(0)

  return (
    <div className="dark flex min-h-screen bg-background text-foreground">
      <AppSidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b px-5 py-3.5">
          <div className="flex items-center gap-2">
            <h1 className="text-[15px] font-semibold">My Custom Dashboard</h1>
            <Pencil className="size-3.5 text-text-muted" />
          </div>
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefreshKey((k) => k + 1)}
            >
              <RefreshCw /> Refresh
            </Button>
            <Button size="sm">
              <Pencil /> Edit dashboard
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-2">
          <StatBlock range={range} refreshKey={refreshKey} />
          <ConversationsPanel range={range} refreshKey={refreshKey} />

          <CallsPanel range={range} refreshKey={refreshKey} />
          <OutcomePanel range={range} refreshKey={refreshKey} />

          <AgentBarPanel range={range} refreshKey={refreshKey} />
          <PickupPanel range={range} refreshKey={refreshKey} />
        </div>
      </main>
    </div>
  )
}
