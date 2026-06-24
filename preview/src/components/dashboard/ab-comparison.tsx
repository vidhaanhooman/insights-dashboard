"use client"

import * as React from "react"
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Crown,
  Minus,
  RefreshCw,
  Trophy,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { DateRangePicker } from "@/components/date-range-picker"
import { useVariantSeries, useVariantStats } from "@/lib/insights/hooks"
import { formatValue, type VariantStats } from "@/lib/insights/resolver"
import type { MetricFormat, TimeRange } from "@/lib/insights/types"
import { cn } from "@/lib/utils"
import { AppSidebar } from "./app-sidebar"
import { LinePanel } from "./views/panels"

const VARIANTS = ["palmonas", "standard", "multi-llm", "test conversion"] as const

const VAR_A_COLOR = "var(--chart-1)" // primary blue
const VAR_B_COLOR = "var(--chart-4)" // light blue

// The metrics we line up between the two variants. `better:"up"` means a higher
// value wins; durations are neutral (informational only).
interface MetricDef {
  key: keyof VariantStats
  label: string
  format: MetricFormat
  better: "up" | "neutral"
  sub?: string
}

const METRICS: MetricDef[] = [
  { key: "calls", label: "Calls attempted", format: "count", better: "neutral", sub: "Sample size" },
  { key: "pickup", label: "Pickup rate", format: "percent", better: "up", sub: "Connected ÷ attempted" },
  { key: "qualRate", label: "Qualification rate", format: "percent", better: "up", sub: "Qualified ÷ connected" },
  { key: "qualified", label: "Qualified leads", format: "count", better: "up", sub: "Outcome = Qualified" },
  { key: "avgdur", label: "Avg duration", format: "duration", better: "neutral", sub: "Per connected call" },
]

// Metric the headline verdict is decided on.
const PRIMARY: { key: keyof VariantStats; label: string }[] = [
  { key: "pickup", label: "Pickup rate" },
  { key: "qualRate", label: "Qualification rate" },
  { key: "qualified", label: "Qualified leads" },
]

// Standard normal CDF via an erf approximation — turns a z-score into a
// confidence level for the two-proportion test below.
function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989423 * Math.exp((-z * z) / 2)
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  return z > 0 ? 1 - p : p
}

// Two-proportion z-test on pickup rate (connected / attempted). Returns the
// winning variant on the primary metric plus the confidence the lift is real.
function significance(a: VariantStats, b: VariantStats) {
  const pa = a.calls ? a.connected / a.calls : 0
  const pb = b.calls ? b.connected / b.calls : 0
  const pPool =
    a.calls + b.calls ? (a.connected + b.connected) / (a.calls + b.calls) : 0
  const se = Math.sqrt(
    pPool * (1 - pPool) * (1 / (a.calls || 1) + 1 / (b.calls || 1))
  )
  const z = se ? (pb - pa) / se : 0
  const confidence = (2 * normalCdf(Math.abs(z)) - 1) * 100
  return { z, confidence }
}

function deltaPct(av: number, bv: number) {
  if (!av) return bv ? 100 : 0
  return ((bv - av) / av) * 100
}

// ---------------------------------------------------------------------------

function VariantSelect({
  side,
  value,
  exclude,
  color,
  onChange,
}: {
  side: "A" | "B"
  value: string
  exclude: string
  color: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold text-white"
        style={{ backgroundColor: color }}
      >
        {side}
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-[200px] font-mono text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {VARIANTS.map((v) => (
            <SelectItem
              key={v}
              value={v}
              disabled={v === exclude}
              className="font-mono"
            >
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function Verdict({
  a,
  b,
  primary,
  loading,
}: {
  a: VariantStats
  b: VariantStats
  primary: keyof VariantStats
  loading: boolean
}) {
  if (loading) return <Skeleton className="h-[88px] w-full rounded-xl" />

  const av = a[primary] as number
  const bv = b[primary] as number
  const { confidence } = significance(a, b)
  const lift = deltaPct(av, bv)
  const winner = Math.abs(lift) < 0.5 ? null : lift > 0 ? "B" : "A"
  const significant = confidence >= 95
  const wColor = winner === "A" ? VAR_A_COLOR : VAR_B_COLOR
  const wName = winner === "A" ? a.agent : b.agent

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border px-5 py-4",
        winner
          ? "border-emerald-400/30 bg-emerald-400/5"
          : "border-border bg-card"
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            winner ? "bg-emerald-400/15 text-emerald-400" : "bg-surface-2 text-text-muted"
          )}
        >
          {winner ? <Trophy size={18} /> : <Minus size={18} />}
        </span>
        <div>
          {winner ? (
            <p className="text-sm font-medium text-text">
              Variant{" "}
              <span className="font-mono font-semibold" style={{ color: wColor }}>
                {wName}
              </span>{" "}
              is winning
            </p>
          ) : (
            <p className="text-sm font-medium text-text">Too close to call</p>
          )}
          <p className="mt-0.5 text-xs text-text-muted">
            {winner
              ? `${Math.abs(lift).toFixed(1)}% lift on ${
                  PRIMARY.find((p) => p.key === primary)?.label
                }`
              : "Variants are within 0.5% on the primary metric"}
          </p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-6">
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Confidence
          </p>
          <p className="text-lg font-semibold tabular-nums text-text">
            {confidence.toFixed(1)}%
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium",
            significant
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
              : "border-amber-400/30 bg-amber-400/10 text-amber-400"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              significant ? "bg-emerald-400" : "bg-amber-400"
            )}
          />
          {significant ? "Statistically significant" : "Not yet significant"}
        </span>
      </div>
    </div>
  )
}

function MetricRow({
  def,
  a,
  b,
  loading,
}: {
  def: MetricDef
  a: VariantStats
  b: VariantStats
  loading: boolean
}) {
  if (loading) return <Skeleton className="h-[104px] w-full rounded-xl" />

  const av = a[def.key] as number
  const bv = b[def.key] as number
  const lift = deltaPct(av, bv)
  const max = Math.max(av, bv, 1)
  const scored = def.better === "up"
  // Which side wins (only meaningful when the metric is directional).
  const winner = !scored || Math.abs(lift) < 0.5 ? null : lift > 0 ? "B" : "A"

  const TrendIcon =
    Math.abs(lift) < 0.5 ? ArrowRight : lift > 0 ? ArrowUpRight : ArrowDownRight
  const trendColor =
    !scored || Math.abs(lift) < 0.5
      ? "text-text-muted"
      : lift > 0
        ? "text-emerald-400"
        : "text-red-400"

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-sm font-medium text-text">{def.label}</p>
          {def.sub && <p className="text-xs text-text-muted">{def.sub}</p>}
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
            trendColor
          )}
        >
          <TrendIcon size={13} />
          {Math.abs(lift).toFixed(1)}%
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {(["A", "B"] as const).map((side) => {
          const v = side === "A" ? av : bv
          const color = side === "A" ? VAR_A_COLOR : VAR_B_COLOR
          const isWin = winner === side
          return (
            <div key={side} className="flex items-center gap-2.5">
              <span
                className="w-4 shrink-0 text-[10px] font-semibold"
                style={{ color }}
              >
                {side}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(v / max) * 100}%`,
                    backgroundColor: color,
                    opacity: winner && !isWin ? 0.45 : 1,
                  }}
                />
              </div>
              <span
                className={cn(
                  "flex w-20 shrink-0 items-center justify-end gap-1 text-sm tabular-nums",
                  isWin ? "font-semibold text-text" : "text-text-dim"
                )}
              >
                {isWin && <Crown size={11} className="text-emerald-400" />}
                {formatValue(v, def.format)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ComparisonTable({
  a,
  b,
  loading,
}: {
  a: VariantStats
  b: VariantStats
  loading: boolean
}) {
  if (loading) return <Skeleton className="h-[260px] w-full rounded-xl" />

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-sm font-medium text-text">
        Full breakdown
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            <th className="px-4 py-2 font-semibold">Metric</th>
            <th className="px-4 py-2 text-right font-semibold">
              <span className="font-mono normal-case" style={{ color: VAR_A_COLOR }}>
                A · {a.agent}
              </span>
            </th>
            <th className="px-4 py-2 text-right font-semibold">
              <span className="font-mono normal-case" style={{ color: VAR_B_COLOR }}>
                B · {b.agent}
              </span>
            </th>
            <th className="px-4 py-2 text-right font-semibold">Δ</th>
          </tr>
        </thead>
        <tbody>
          {METRICS.map((def) => {
            const av = a[def.key] as number
            const bv = b[def.key] as number
            const lift = deltaPct(av, bv)
            const scored = def.better === "up"
            const winner =
              !scored || Math.abs(lift) < 0.5 ? null : lift > 0 ? "B" : "A"
            return (
              <tr
                key={def.key}
                className="border-b border-border/60 last:border-0"
              >
                <td className="px-4 py-2.5 text-text-dim">{def.label}</td>
                <td
                  className={cn(
                    "px-4 py-2.5 text-right tabular-nums",
                    winner === "A" ? "font-semibold text-text" : "text-text-dim"
                  )}
                >
                  {formatValue(av, def.format)}
                </td>
                <td
                  className={cn(
                    "px-4 py-2.5 text-right tabular-nums",
                    winner === "B" ? "font-semibold text-text" : "text-text-dim"
                  )}
                >
                  {formatValue(bv, def.format)}
                </td>
                <td
                  className={cn(
                    "px-4 py-2.5 text-right tabular-nums",
                    !scored || Math.abs(lift) < 0.5
                      ? "text-text-muted"
                      : lift > 0
                        ? "text-emerald-400"
                        : "text-red-400"
                  )}
                >
                  {lift > 0 ? "+" : ""}
                  {lift.toFixed(1)}%
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function AbComparison() {
  const [range] = React.useState<TimeRange>("7d")
  const [dateStart, setDateStart] = React.useState("2026-06-16T00:00")
  const [dateEnd, setDateEnd] = React.useState("2026-06-23T23:59")
  const [variantA, setVariantA] = React.useState<string>("palmonas")
  const [variantB, setVariantB] = React.useState<string>("multi-llm")
  const [primary, setPrimary] = React.useState<keyof VariantStats>("pickup")
  const [refreshKey, setRefreshKey] = React.useState(0)

  const { data: a, loading: la } = useVariantStats(variantA, range, refreshKey)
  const { data: b, loading: lb } = useVariantStats(variantB, range, refreshKey)
  const agents = React.useMemo(() => [variantA, variantB], [variantA, variantB])
  const { data: series, loading: ls } = useVariantSeries(agents, range, refreshKey)
  const loading = la || lb

  // Remap to stable a/b keys — the chart derives `--color-<key>` CSS vars from
  // these, and raw agent names can contain spaces ("test conversion").
  const chartData = React.useMemo(
    () =>
      series.map((p) => ({
        label: p.label,
        a: p[variantA] as number,
        b: p[variantB] as number,
      })),
    [series, variantA, variantB]
  )

  return (
    <div className="dark flex min-h-screen bg-background text-foreground">
      <AppSidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b px-5 py-3.5">
          <span className="text-[15px] font-semibold">A/B Test</span>
          <span className="rounded-md border border-border-strong bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-text-muted">
            Variant comparison
          </span>
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefreshKey((k) => k + 1)}
            >
              <RefreshCw /> Refresh
            </Button>
          </div>
        </header>

        <div className="overflow-x-hidden px-7 py-6">
          {/* Variant selectors + range */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <VariantSelect
              side="A"
              value={variantA}
              exclude={variantB}
              color={VAR_A_COLOR}
              onChange={setVariantA}
            />
            <span className="text-xs font-medium text-text-muted">vs</span>
            <VariantSelect
              side="B"
              value={variantB}
              exclude={variantA}
              color={VAR_B_COLOR}
              onChange={setVariantB}
            />
            <div className="ml-auto">
              <DateRangePicker
                startValue={dateStart}
                endValue={dateEnd}
                onApply={(s, e) => {
                  setDateStart(s)
                  setDateEnd(e)
                }}
              />
            </div>
          </div>

          {/* Primary metric selector */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-text-muted">Decide winner on</span>
            <div className="inline-flex items-center rounded-md border border-border-strong bg-surface-2 p-0.5">
              {PRIMARY.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPrimary(p.key)}
                  className={cn(
                    "h-7 rounded-md px-3 text-xs transition-colors",
                    primary === p.key
                      ? "bg-white text-black shadow-sm"
                      : "text-text-dim hover:text-text"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Verdict */}
          <div className="mt-4">
            <Verdict a={a} b={b} primary={primary} loading={loading} />
          </div>

          {/* Metric comparison cards */}
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {METRICS.map((def) => (
              <MetricRow key={def.key} def={def} a={a} b={b} loading={loading} />
            ))}
          </div>

          {/* Daily trend */}
          <div className="mt-4">
            <LinePanel
              title="Connected calls per day"
              description="Daily connected-call volume for each variant"
              loading={ls}
              data={chartData}
              series={[
                { key: "a", label: `A · ${variantA}`, color: VAR_A_COLOR },
                { key: "b", label: `B · ${variantB}`, color: VAR_B_COLOR },
              ]}
            />
          </div>

          {/* Full breakdown table */}
          <div className="mt-4">
            <ComparisonTable a={a} b={b} loading={loading} />
          </div>
        </div>
      </main>
    </div>
  )
}
