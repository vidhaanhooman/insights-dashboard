"use client"

// Mock campaign-results source + data hook.
//
// TODO: wire to API. Replace MOCK_CAMPAIGN and the body of useCampaignResult
// with a real fetch/query. The return shape (DataResult<CampaignResult>) and the
// types in ./types are the contract the rest of the page depends on — keep them.

import * as React from "react"
import type { DataResult } from "@/lib/insights/types"
import type { CampaignMetric, CampaignResult, Variant } from "./types"

// Fixed metrics — the default basis on which variants are compared. Present on
// every campaign regardless of custom metrics. This is the call funnel + task
// lifecycle set shown by default.
// TODO: source fixed metrics from the API / shared metric registry.
const FIXED_METRICS: CampaignMetric[] = [
  { id: "calls", label: "Calls Count", format: "count", kind: "fixed", group: "Calls" },
  { id: "connected", label: "Calls Connected", format: "count", kind: "fixed", group: "Calls" },
  { id: "pickup", label: "Pick Up Rate", format: "percent", kind: "fixed", group: "Calls" },
  { id: "tasks_created", label: "Tasks Created", format: "count", kind: "fixed", group: "Tasks" },
  { id: "tasks_queued", label: "Tasks Queued", format: "count", kind: "fixed", group: "Tasks" },
  { id: "tasks_running", label: "Tasks Running", format: "count", kind: "fixed", group: "Tasks" },
  { id: "tasks_paused", label: "Tasks Paused", format: "count", kind: "fixed", group: "Tasks" },
  { id: "tasks_completed", label: "Tasks Completed", format: "count", kind: "fixed", group: "Tasks" },
]

// Custom metrics — defined per campaign by the user. Provided by the campaign
// payload; rendered as additional columns with no special treatment.
// TODO: source custom metrics from the campaign definition.
const CUSTOM_METRICS: CampaignMetric[] = [
  { id: "booking_rate", label: "Booking rate", format: "percent", kind: "custom", group: "Custom metrics" },
  { id: "transfer_rate", label: "Transfer to human", format: "percent", kind: "custom", group: "Custom metrics" },
  { id: "sentiment", label: "Avg sentiment", format: "ratio", kind: "custom", group: "Custom metrics" },
]

const VARIANTS: Variant[] = [
  {
    id: "v-control",
    name: "Base agent",
    isControl: true,
    overrides: {},
    metrics: {
      calls: 1240,
      connected: 742,
      pickup: 59.8,
      tasks_created: 318,
      tasks_queued: 41,
      tasks_running: 57,
      tasks_paused: 22,
      tasks_completed: 198,
      booking_rate: 18.2,
      transfer_rate: 9.1,
      sentiment: 0.42,
    },
  },
  {
    id: "v-a",
    name: "Variant A — warm voice",
    isControl: false,
    overrides: { voice: "Aria (warm)", greeting: "Hi, thanks for picking up — quick question for you." },
    metrics: {
      calls: 1198,
      connected: 736,
      pickup: 61.4,
      tasks_created: 332,
      tasks_queued: 38,
      tasks_running: 61,
      tasks_paused: 19,
      tasks_completed: 214,
      booking_rate: 20.4,
      transfer_rate: 8.7,
      sentiment: 0.51,
    },
  },
  {
    id: "v-b",
    name: "Variant B — alt LLM",
    isControl: false,
    overrides: { llm: "gpt-5.4", greeting: "Hello! I'm calling about your recent enquiry." },
    metrics: {
      calls: 1213,
      connected: 705,
      pickup: 58.1,
      tasks_created: 301,
      tasks_queued: 47,
      tasks_running: 53,
      tasks_paused: 26,
      tasks_completed: 175,
      booking_rate: 17.9,
      transfer_rate: 10.2,
      sentiment: 0.39,
    },
  },
  {
    id: "v-c",
    name: "Variant C — concise greeting",
    isControl: false,
    overrides: { voice: "Vela (neutral)", llm: "gpt-5.5", greeting: "Hi — got two minutes?" },
    metrics: {
      calls: 642,
      connected: 389,
      pickup: 60.6,
      tasks_created: 166,
      tasks_queued: 24,
      tasks_running: 29,
      tasks_paused: 11,
      tasks_completed: 102,
      booking_rate: 19.0,
      // Insufficient data logged for this metric on this variant → renders "—".
      transfer_rate: null,
      sentiment: 0.46,
    },
  },
]

const MOCK_CAMPAIGN: CampaignResult = {
  id: "camp_collections_q2",
  name: "Collections outreach — Q2",
  status: "ended",
  totalCalls: VARIANTS.reduce((sum, v) => sum + (v.metrics.calls ?? 0), 0),
  dateRange: { start: "2026-05-19", end: "2026-06-02" },
  metrics: [...FIXED_METRICS, ...CUSTOM_METRICS],
  variants: VARIANTS,
}

// Brief loading flag whenever the id changes, mirroring the insights hooks.
function useLoadingFor(key: string): boolean {
  const [readyKey, setReadyKey] = React.useState<string | null>(null)
  React.useEffect(() => {
    const t = setTimeout(() => setReadyKey(key), 240)
    return () => clearTimeout(t)
  }, [key])
  return readyKey !== key
}

export function useCampaignResult(
  campaignId: string
): DataResult<CampaignResult> {
  const loading = useLoadingFor(`campaign|${campaignId}`)
  // TODO: fetch by campaignId. Mock ignores the id and returns the one campaign.
  const data = React.useMemo(() => MOCK_CAMPAIGN, [])
  return { data, loading }
}
