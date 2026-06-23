// The single resolver every widget routes through — system + custom metrics alike.
// Pure functions over the (mock) event source; swap the imports in mock-data.ts for real data.

import {
  DAILY,
  EVENTS,
  RANGE_DAYS,
  type CallEvent,
} from "./mock-data"
import type {
  FilterClause,
  GroupField,
  Metric,
  MetricFormat,
  TimeRange,
} from "./types"

function inRange(e: CallEvent, range: TimeRange) {
  return e.dayAgo < RANGE_DAYS[range]
}

function matchFilter(e: CallEvent, where: FilterClause[] = []) {
  return where.every((f) => String(e[f.field]) === String(f.value))
}

// A single scalar for number cards.
export function resolveScalar(metric: Metric, range: TimeRange): number {
  const ev = EVENTS.filter((e) => inRange(e, range))
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

export interface SeriesPoint {
  label: string
  Attempted: number
  Connected: number
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
      const ev = EVENTS.filter((e) => e.dayAgo === d)
      buckets.push({
        label: `D-${d}`,
        Attempted: ev.length,
        Connected: ev.filter((e) => e.connected).length,
      })
    }
  }
  return buckets
}

export interface GroupPoint {
  name: string
  value: number
}

// Category buckets for bar / pie.
export function resolveGrouped(field: GroupField, range: TimeRange): GroupPoint[] {
  const ev = EVENTS.filter((e) => inRange(e, range))
  const map: Record<string, number> = {}
  ev.forEach((e) => {
    const k = String(e[field])
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

export interface ConversationPoint {
  label: string
  Inbound: number
  Outbound: number
  Web: number
  Tasks: number
}

// Multi-series daily buckets for the hero Conversations & Tasks chart.
export function resolveConversations(range: TimeRange): ConversationPoint[] {
  const span = RANGE_DAYS[range]
  const days = DAILY.filter((d) => d.dayAgo < span).sort(
    (a, b) => b.dayAgo - a.dayAgo
  )
  return days.map((d) => ({
    label: `Jun ${22 - d.dayAgo}`,
    Inbound: d.inbound,
    Outbound: d.outbound,
    Web: d.web,
    Tasks: d.tasksCreated,
  }))
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

export interface InboundSummary {
  received: number
  avgDur: number
  transferRate: number
  csat: number
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
