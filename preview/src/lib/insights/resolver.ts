// The single resolver every widget routes through — system + custom metrics alike.
// Pure functions over the (mock) event source; swap the imports in mock-data.ts for real data.

import {
  DAILY,
  EVENTS,
  RANGE_DAYS,
  type CallEvent,
} from "./mock-data"
import type { FilterClause, Metric, MetricFormat, TimeRange } from "./types"

function inRange(e: CallEvent, range: TimeRange) {
  return e.dayAgo < RANGE_DAYS[range]
}

// Intra-day buckets so multi-day series read dense + spiky (not one flat point
// per day). Only the first bucket of each day carries an x-axis label.
const BUCKETS = [0, 4, 8, 12, 16, 20]
const dayLabel = (dayAgo: number) => `Jun ${22 - dayAgo}`
// Deterministic 0..1 noise so the mock stays stable across refreshes.
const noise = (i: number) => {
  const r = Math.sin(i * 12.9898) * 43758.5453
  return r - Math.floor(r)
}

function matchFilter(e: CallEvent, where: FilterClause[] = []) {
  return where.every((f) => String(e[f.field]) === String(f.value))
}

// Compute a metric's scalar from an arbitrary event slice.
function scalarOf(metric: Metric, ev: CallEvent[]): number {
  const calls = ev.length
  const connected = ev.filter((e) => e.connected).length
  switch (metric.source.kind) {
    case "system":
      if (metric.source.key === "calls") return calls
      if (metric.source.key === "connected") return connected
      if (metric.source.key === "avgdur") {
        const c = ev.filter((e) => e.connected)
        return c.length ? c.reduce((a, e) => a + e.duration, 0) / c.length : 0
      }
      return 0
    case "derived":
      return calls ? (connected / calls) * 100 : 0
    case "filtered": {
      const where = metric.source.where
      return ev.filter((e) => matchFilter(e, where)).length
    }
    default:
      return 0
  }
}

// A single scalar for number cards.
export function resolveScalar(metric: Metric, range: TimeRange): number {
  return scalarOf(
    metric,
    EVENTS.filter((e) => inRange(e, range))
  )
}

export interface MetricPoint {
  label: string
  value: number
  [key: string]: string | number
}

// Per-day series of a metric's value — for line charts driven by the chosen metric.
export function resolveMetricSeries(
  metric: Metric,
  range: TimeRange
): MetricPoint[] {
  const span = RANGE_DAYS[range]
  const out: MetricPoint[] = []
  if (range === "today") {
    for (let h = 0; h < 24; h += 2) {
      const ev = EVENTS.filter(
        (e) => e.dayAgo === 0 && e.hour >= h && e.hour < h + 2
      )
      out.push({ label: `${h}:00`, value: Math.round(scalarOf(metric, ev)) })
    }
  } else {
    for (let d = span - 1; d >= 0; d--) {
      const ev = EVENTS.filter((e) => e.dayAgo === d)
      out.push({ label: `D-${d}`, value: Math.round(scalarOf(metric, ev)) })
    }
  }
  return out
}

export interface SeriesPoint {
  label: string
  Attempted: number
  Connected: number
  [key: string]: string | number
}

// Time buckets for line charts.
export function resolveSeries(range: TimeRange): SeriesPoint[] {
  const span = RANGE_DAYS[range]
  const buckets: SeriesPoint[] = []
  if (range === "today") {
    for (let h = 0; h < 24; h += 2) {
      const ev = EVENTS.filter((e) => e.dayAgo === 0 && e.hour >= h && e.hour < h + 2)
      buckets.push({
        label: `${h}:00`,
        Attempted: ev.length,
        Connected: ev.filter((e) => e.connected).length,
      })
    }
  } else {
    for (let d = span - 1; d >= 0; d--) {
      BUCKETS.forEach((b, bi) => {
        const ev = EVENTS.filter(
          (e) => e.dayAgo === d && e.hour >= b && e.hour < b + 4
        )
        buckets.push({
          label: bi === 0 ? dayLabel(d) : "",
          Attempted: ev.length,
          Connected: ev.filter((e) => e.connected).length,
        })
      })
    }
  }
  return buckets
}

export interface GroupPoint {
  name: string
  value: number
}

// Map an event to a category bucket for a given group-by field. Known fields use
// real data; the rest derive deterministic buckets so each group-by varies.
function bucketOf(e: CallEvent, field: string): string {
  switch (field) {
    case "agent":
      return e.agent
    case "outcome":
      return e.outcome
    case "callInfo.endReason":
      return e.connected ? "completed" : e.outcome
    case "callInfo.from":
      return ["US", "UK", "IN", "CA"][e.hour % 4]
    case "callInfo.to":
      return ["Sales", "Support", "Billing"][e.duration % 3]
    case "callInfo.attempt":
      return `Attempt ${1 + (e.hour % 3)}`
    default:
      return e.outcome
  }
}

// Category buckets for bar / pie — works for any group-by field.
export function resolveGrouped(field: string, range: TimeRange): GroupPoint[] {
  const ev = EVENTS.filter((e) => inRange(e, range))
  const map: Record<string, number> = {}
  ev.forEach((e) => {
    const k = bucketOf(e, field)
    map[k] = (map[k] || 0) + 1
  })
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export interface AgentRow {
  agent: string
  calls: number
  connected: number
  pickup: number
  avgdur: number
  [key: string]: string | number
}

export function resolveAgentTable(range: TimeRange): AgentRow[] {
  const ev = EVENTS.filter((e) => inRange(e, range))
  const agents = Array.from(new Set(ev.map((e) => e.agent)))
  return agents
    .map((agent) => {
      const rows = ev.filter((e) => e.agent === agent)
      const conn = rows.filter((e) => e.connected)
      return {
        agent,
        calls: rows.length,
        connected: conn.length,
        pickup: rows.length ? Math.round((conn.length / rows.length) * 100) : 0,
        avgdur: conn.length
          ? Math.round(conn.reduce((a, e) => a + e.duration, 0) / conn.length)
          : 0,
      }
    })
    .sort((a, b) => b.calls - a.calls)
}

// --- A/B variant comparison --------------------------------------------------
// Per-agent funnel stats + daily series, for comparing two agent variants.
export interface VariantStats {
  agent: string
  calls: number
  connected: number
  qualified: number
  pickup: number // %
  qualRate: number // % of connected that qualified
  avgdur: number // seconds
  talkTime: number // seconds
}

export function resolveVariantStats(agent: string, range: TimeRange): VariantStats {
  const ev = EVENTS.filter((e) => inRange(e, range) && e.agent === agent)
  const conn = ev.filter((e) => e.connected)
  const qualified = ev.filter((e) => e.outcome === "Qualified").length
  const talkTime = conn.reduce((a, e) => a + e.duration, 0)
  return {
    agent,
    calls: ev.length,
    connected: conn.length,
    qualified,
    pickup: ev.length ? (conn.length / ev.length) * 100 : 0,
    qualRate: conn.length ? (qualified / conn.length) * 100 : 0,
    avgdur: conn.length ? talkTime / conn.length : 0,
    talkTime,
  }
}

// Daily connected-call counts for each of two agents, aligned on the same days.
export interface VariantSeriesPoint {
  label: string
  [agent: string]: string | number
}

export function resolveVariantSeries(
  agents: string[],
  range: TimeRange
): VariantSeriesPoint[] {
  const span = RANGE_DAYS[range]
  const days = Array.from({ length: span }, (_, i) => span - 1 - i) // oldest → newest
  return days.map((dayAgo) => {
    const point: VariantSeriesPoint = { label: `Jun ${22 - dayAgo}` }
    agents.forEach((agent) => {
      point[agent] = EVENTS.filter(
        (e) => e.dayAgo === dayAgo && e.agent === agent && e.connected
      ).length
    })
    return point
  })
}

export interface ConversationPoint {
  label: string
  Inbound: number
  Outbound: number
  Web: number
  Tasks: number
  [key: string]: string | number
}

// Multi-series daily buckets for the hero Conversations & Tasks chart.
export function resolveConversations(range: TimeRange): ConversationPoint[] {
  const span = RANGE_DAYS[range]
  const days = DAILY.filter((d) => d.dayAgo < span).sort(
    (a, b) => b.dayAgo - a.dayAgo
  )
  // Split each day's totals into spiky intra-day buckets (sum ≈ the daily value).
  const out: ConversationPoint[] = []
  days.forEach((d, di) => {
    BUCKETS.forEach((_, bi) => {
      const f = 0.55 + noise(di * 7 + bi) * 0.9
      out.push({
        label: bi === 0 ? dayLabel(d.dayAgo) : "",
        Inbound: Math.round((d.inbound / BUCKETS.length) * f),
        Outbound: Math.round((d.outbound / BUCKETS.length) * f),
        Web: Math.round((d.web / BUCKETS.length) * f),
        Tasks: Math.round((d.tasksCreated / BUCKETS.length) * f),
      })
    })
  })
  return out
}

export interface KpiSummary {
  inbound: { calls: number; avgDur: number }
  outbound: { calls: number; avgDur: number }
  tasks: { created: number; running: number }
}

// The grouped KPI strip across the top of the Overview.
export function resolveKpiSummary(range: TimeRange): KpiSummary {
  const span = RANGE_DAYS[range]
  const days = DAILY.filter((d) => d.dayAgo < span)
  const sum = (sel: (d: (typeof days)[number]) => number) =>
    days.reduce((a, d) => a + sel(d), 0)
  const avg = (sel: (d: (typeof days)[number]) => number) =>
    days.length ? sum(sel) / days.length : 0
  return {
    inbound: { calls: sum((d) => d.inbound), avgDur: avg((d) => d.inboundDur) },
    outbound: { calls: sum((d) => d.outbound), avgDur: avg((d) => d.outboundDur) },
    tasks: { created: sum((d) => d.tasksCreated), running: sum((d) => d.running) },
  }
}

// ---- Metric detail (enlarged stat) data ----

export interface NumberWiseRow {
  from: string
  pickup: number
  calls: number
  [key: string]: string | number
}

export function resolveNumberWise(range: TimeRange): NumberWiseRow[] {
  let s = 131 + RANGE_DAYS[range]
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
  const rows: NumberWiseRow[] = []
  for (let i = 0; i < 14; i++) {
    const calls = Math.round(rnd() * (RANGE_DAYS[range] + 1))
    const pickup = calls ? Math.round(rnd() * 100) : 0
    rows.push({ from: `+91803531${60 + i}${Math.floor(rnd() * 90) + 10}`, pickup, calls })
  }
  return rows.sort((a, b) => a.from.localeCompare(b.from))
}

export interface AttemptWiseRow {
  attempt: string
  pickup: number
  [key: string]: string | number
}

export function resolveAttemptWise(range: TimeRange): AttemptWiseRow[] {
  const ev = EVENTS.filter((e) => inRange(e, range))
  const map: Record<string, { calls: number; conn: number }> = {}
  ev.forEach((e) => {
    const k = `Attempt ${1 + (e.hour % 3)}`
    const m = map[k] ?? (map[k] = { calls: 0, conn: 0 })
    m.calls++
    if (e.connected) m.conn++
  })
  return Object.entries(map)
    .map(([attempt, { calls, conn }]) => ({
      attempt,
      pickup: calls ? Math.round((conn / calls) * 100) : 0,
    }))
    .sort((a, b) => a.attempt.localeCompare(b.attempt))
}

// Pickup rate over time (hourly for today, otherwise per day).
export function resolvePickupByTime(range: TimeRange): MetricPoint[] {
  const span = RANGE_DAYS[range]
  const out: MetricPoint[] = []
  const pct = (ev: CallEvent[]) =>
    ev.length
      ? Math.round((ev.filter((e) => e.connected).length / ev.length) * 100)
      : 0
  if (range === "today") {
    for (let h = 0; h < 24; h++) {
      const ev = EVENTS.filter((e) => e.dayAgo === 0 && e.hour === h)
      out.push({ label: `${h}:00`, value: pct(ev) })
    }
  } else {
    for (let d = span - 1; d >= 0; d--) {
      BUCKETS.forEach((b, bi) => {
        const ev = EVENTS.filter(
          (e) => e.dayAgo === d && e.hour >= b && e.hour < b + 4
        )
        out.push({ label: bi === 0 ? dayLabel(d) : "", value: pct(ev) })
      })
    }
  }
  return out
}

export interface OutboundSummary {
  attempted: number
  connected: number
  avgDur: number
  pickup: number
}

export function resolveOutboundSummary(range: TimeRange): OutboundSummary {
  const ev = EVENTS.filter((e) => inRange(e, range))
  const attempted = ev.length
  const connected = ev.filter((e) => e.connected).length
  const c = ev.filter((e) => e.connected)
  return {
    attempted,
    connected,
    avgDur: c.length ? c.reduce((a, e) => a + e.duration, 0) / c.length : 0,
    pickup: attempted ? (connected / attempted) * 100 : 0,
  }
}

export interface InboundSummary {
  received: number
  avgDur: number
  transferRate: number
  csat: number
}

export interface InboundSeriesPoint {
  label: string
  Calls: number
  Transfers: number
  [key: string]: string | number
}

export function resolveInboundSeries(range: TimeRange): InboundSeriesPoint[] {
  const span = RANGE_DAYS[range]
  if (range === "today") {
    const out: InboundSeriesPoint[] = []
    for (let h = 0; h < 24; h += 2) {
      out.push({ label: `${h}:00`, Calls: 0, Transfers: 0 })
    }
    return out
  }
  return DAILY.filter((d) => d.dayAgo < span)
    .sort((a, b) => b.dayAgo - a.dayAgo)
    .map((d) => ({
      label: `Jun ${22 - d.dayAgo}`,
      Calls: d.inbound,
      Transfers: d.inboundTransfers,
    }))
}

export interface InboundAgentRow {
  agent: string
  calls: number
  transferred: number
  transferRate: number
  avgDur: number
  [key: string]: string | number
}

export function resolveInboundAgentTable(range: TimeRange): InboundAgentRow[] {
  const ev = EVENTS.filter((e) => inRange(e, range))
  const agents = Array.from(new Set(ev.map((e) => e.agent)))
  return agents
    .map((agent) => {
      const rows = ev.filter((e) => e.agent === agent)
      const calls = rows.length
      const transferred = Math.round(calls * 0.15)
      const avgDur = calls
        ? Math.round(rows.reduce((a, e) => a + e.duration, 0) / calls)
        : 0
      return {
        agent,
        calls,
        transferred,
        transferRate: calls ? Math.round((transferred / calls) * 100) : 0,
        avgDur,
      }
    })
    .sort((a, b) => b.calls - a.calls)
}

export function resolveInboundSummary(range: TimeRange): InboundSummary {
  const span = RANGE_DAYS[range]
  const days = DAILY.filter((d) => d.dayAgo < span)
  const received = days.reduce((a, d) => a + d.inbound, 0)
  const transfers = days.reduce((a, d) => a + d.inboundTransfers, 0)
  const avgDur = days.length
    ? days.reduce((a, d) => a + d.inboundDur, 0) / days.length
    : 0
  const csat = days.length
    ? days.reduce((a, d) => a + d.csat, 0) / days.length
    : 0
  return {
    received,
    avgDur,
    transferRate: received ? (transfers / received) * 100 : 0,
    csat,
  }
}

// Type-aware formatting — the one place a metric's `format` becomes a display string.
export function formatValue(value: number | null, format: MetricFormat): string {
  if (value == null) return "—"
  switch (format) {
    case "percent":
      return `${value.toFixed(2).replace(/\.00$/, "")}%`
    case "ratio":
      return value.toFixed(2).replace(/\.00$/, "")
    case "duration": {
      const m = Math.floor(value / 60)
      const s = Math.round(value % 60)
      return m ? `${m}m ${s}s` : `${s}s`
    }
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value)
    case "count":
    default:
      return new Intl.NumberFormat("en-US").format(Math.round(value))
  }
}

// --- Calls heatmap -----------------------------------------------------------
// Number of calls per day (rows) × time-of-day bucket (cols), from EVENTS.
export interface HeatmapData {
  cols: string[]
  rows: { label: string; cells: number[] }[]
  max: number
}

const HEATMAP_BUCKETS = [0, 4, 8, 12, 16, 20]
const HEATMAP_COLS = ["12a", "4a", "8a", "12p", "4p", "8p"]

export function resolveHeatmap(range: TimeRange): HeatmapData {
  const span = RANGE_DAYS[range]
  let max = 0
  const rows: { label: string; cells: number[] }[] = []
  for (let d = span - 1; d >= 0; d--) {
    const dom = 22 - d
    const label = `${String(dom).padStart(2, "0")}/06`
    const dayEv = EVENTS.filter((e) => e.dayAgo === d)
    const cells = HEATMAP_BUCKETS.map((b) => {
      const n = dayEv.filter((e) => e.hour >= b && e.hour < b + 4).length
      if (n > max) max = n
      return n
    })
    rows.push({ label, cells })
  }
  return { cols: HEATMAP_COLS, rows, max }
}

// --- Duration funnel ---------------------------------------------------------
// Connected calls surviving past each duration threshold — a "how long did
// calls last" funnel. value = calls longer than the stage's threshold.
export interface FunnelStage {
  stage: string
  value: number
  pctOfFirst: number
}

const FUNNEL_THRESHOLDS = [0, 15, 30, 60, 120]
const FUNNEL_LABELS = ["Connected (>0s)", ">15s", ">30s", ">60s", ">120s"]

export function resolveDurationFunnel(range: TimeRange): FunnelStage[] {
  const conn = EVENTS.filter((e) => inRange(e, range) && e.connected)
  const first = conn.length || 1
  return FUNNEL_THRESHOLDS.map((t, i) => {
    const value = conn.filter((e) => e.duration > t).length
    return { stage: FUNNEL_LABELS[i], value, pctOfFirst: Math.round((value / first) * 100) }
  })
}
