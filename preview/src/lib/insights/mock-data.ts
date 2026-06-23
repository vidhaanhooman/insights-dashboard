// Mock event source standing in for the API. Replace the EVENTS export + range
// constants with real fetches; nothing downstream of resolver.ts needs to change.

import type { GroupField, TimeRange } from "./types"

export const OUTCOMES = ["Qualified", "Voicemail", "No answer", "Rejected"] as const
export const AGENTS = ["palmonas", "standard", "multi-llm", "test conversion"] as const

export interface CallEvent {
  dayAgo: number
  hour: number
  agent: string
  connected: boolean
  outcome: string
  duration: number
}

// Deterministic seeded generator so the mock is stable across renders.
function seededEvents(): CallEvent[] {
  let s = 42
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
  const out: CallEvent[] = []
  for (let d = 0; d < 60; d++) {
    const perDay = 4 + Math.floor(rnd() * 18)
    for (let i = 0; i < perDay; i++) {
      const connected = rnd() > 0.62
      out.push({
        dayAgo: d,
        hour: Math.floor(rnd() * 24),
        agent: AGENTS[Math.floor(rnd() * AGENTS.length)],
        connected,
        outcome: connected
          ? OUTCOMES[Math.floor(rnd() * OUTCOMES.length)]
          : "No answer",
        duration: connected ? Math.round(20 + rnd() * 180) : 0,
      })
    }
  }
  return out
}

export const EVENTS: CallEvent[] = seededEvents()

// Per-day rollup powering the Conversations & Tasks chart and the KPI strip.
export interface DayPoint {
  dayAgo: number
  inbound: number
  outbound: number
  web: number
  tasksCreated: number
  inboundDur: number
  outboundDur: number
  running: number
  inboundTransfers: number
  csat: number
}

function seededDaily(): DayPoint[] {
  let s = 7
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
  const out: DayPoint[] = []
  for (let d = 0; d < 60; d++) {
    // a mid-window bump so the line chart has a recognizable peak
    const bump = Math.max(0, 1 - Math.abs(d - 4) / 4)
    const outbound = Math.round(6 + rnd() * 10 + bump * 40)
    const inbound = Math.round(8 + rnd() * 12 + bump * 10)
    out.push({
      dayAgo: d,
      inbound,
      outbound,
      web: Math.round(4 + rnd() * 8 + bump * 30),
      tasksCreated: Math.round(2 + rnd() * 6),
      inboundDur: Math.round(15 + rnd() * 20),
      outboundDur: Math.round(50 + rnd() * 60),
      running: 0,
      inboundTransfers: Math.round(inbound * (0.1 + rnd() * 0.2)),
      csat: 3.8 + rnd() * 1.2,
    })
  }
  return out
}

export const DAILY: DayPoint[] = seededDaily()

export const RANGE_DAYS: Record<TimeRange, number> = { today: 1, "7d": 7, "30d": 30 }
export const RANGE_LABEL: Record<TimeRange, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
}

export function valuesForField(field: GroupField): readonly string[] {
  return field === "outcome" ? OUTCOMES : AGENTS
}
