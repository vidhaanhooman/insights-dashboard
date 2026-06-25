"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useDurationFunnel,
  useGrouped,
  useSeries,
} from "@/lib/insights/hooks"
import type { FunnelStage } from "@/lib/insights/resolver"
import type { TimeRange } from "@/lib/insights/types"
import { cn } from "@/lib/utils"

import { MetricDetail } from "./metric-detail"

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

function DeepCard({
  title,
  action,
  className,
  children,
}: {
  title: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <Card className={cn("gap-0 overflow-hidden py-0", className)}>
      <CardHeader className="flex flex-row items-center justify-between border-b px-5 py-3">
        <span className="text-sm font-medium">{title}</span>
        {action}
      </CardHeader>
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  )
}

// A stacked, centered funnel — each stage narrows by its share of the first.
function DurationFunnel({ stages }: { stages: FunnelStage[] }) {
  const first = stages[0]?.value || 1
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        {stages.map((s, i) => {
          const pct = Math.round((s.value / first) * 100)
          const width = Math.max(pct, 7)
          return (
            <div key={s.stage} className="flex justify-center">
              <div
                className="flex h-11 items-center justify-center rounded-md text-sm font-semibold text-white shadow-sm"
                style={{
                  width: `${width}%`,
                  background: `color-mix(in srgb, var(--chart-1) ${100 - i * 13}%, #11151f)`,
                }}
              >
                {s.value}
              </div>
            </div>
          )
        })}
      </div>
      <div className="space-y-1 border-t border-border pt-3 text-xs text-text-muted">
        {stages.map((s, i) => {
          const prev = i === 0 ? s.value : stages[i - 1].value
          const cont = prev ? Math.round((s.value / prev) * 100) : 0
          return (
            <p key={s.stage}>
              <span className="text-text">{s.stage}</span>: {s.value} ({s.pctOfFirst}% of first)
              {i > 0 && ` · ${cont}% continued past / ${100 - cont}% ended here`}
            </p>
          )
        })}
      </div>
    </div>
  )
}

// Deep dive for a count/duration metric: funnel + trend + agent breakdown.
function CallsDeepDive({
  label,
  range,
  refreshKey,
}: {
  label: string
  range: TimeRange
  refreshKey: number
}) {
  const funnel = useDurationFunnel(range, refreshKey)
  const series = useSeries(range, refreshKey)
  const agents = useGrouped("agent", range, refreshKey)

  const connected = funnel.data[0]?.value ?? 0
  const past30 = funnel.data.find((s) => s.stage === ">30s")?.value ?? 0
  const past60 = funnel.data.find((s) => s.stage === ">60s")?.value ?? 0
  const tiles = [
    { label: "Connected", value: connected.toLocaleString() },
    { label: "Lasted >30s", value: past30.toLocaleString(), sub: connected ? `${Math.round((past30 / connected) * 100)}%` : "" },
    { label: "Lasted >60s", value: past60.toLocaleString(), sub: connected ? `${Math.round((past60 / connected) * 100)}%` : "" },
    { label: "Agents", value: String(agents.data.length) },
  ]

  return (
    <div className="h-full space-y-3.5 overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl border border-border bg-card p-3">
            <p className="truncate text-xs text-text-muted">{t.label}</p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold tracking-tight tabular-nums text-text">{t.value}</span>
              {t.sub && <span className="text-xs text-text-muted">{t.sub}</span>}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-3.5 lg:grid-cols-2">
        <DeepCard title="Duration wise calls funnel">
          {funnel.loading ? <Skeleton className="h-[300px] w-full" /> : <DurationFunnel stages={funnel.data} />}
        </DeepCard>

        <DeepCard title={`${label} over time`}>
          {series.loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <ChartContainer
              config={{ Attempted: { label, color: "var(--chart-1)" } } satisfies ChartConfig}
              className="h-[300px] w-full"
            >
              <LineChart data={series.data} margin={{ top: 8, right: 12, left: -12 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} interval={0} />
                <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line dataKey="Attempted" type="monotone" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          )}
        </DeepCard>
      </div>

      <DeepCard title={`${label} by agent`}>
        {agents.loading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : (
          <ChartContainer
            config={{ value: { label, color: "var(--chart-1)" } } satisfies ChartConfig}
            className="h-[260px] w-full"
          >
            <BarChart data={agents.data} layout="vertical" margin={{ top: 4, right: 16, left: 4 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={100} tickMargin={6} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={26}>
                {agents.data.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </DeepCard>
    </div>
  )
}

export type DeepDiveMetric = "pickup" | "calls" | "duration"

/** Metric-aware enlarge: each metric gets the panels that fit it. */
export function MetricDeepDive({
  metric,
  label,
  range,
  refreshKey,
}: {
  metric: DeepDiveMetric
  label: string
  range: TimeRange
  refreshKey: number
}) {
  if (metric === "pickup") {
    return (
      <div className="h-full overflow-y-auto pr-1">
        <MetricDetail label={label} range={range} refreshKey={refreshKey} />
      </div>
    )
  }
  return <CallsDeepDive label={label} range={range} refreshKey={refreshKey} />
}
