// Post-campaign comparison data model.
//
// Read-only / informational only: this layer carries logged values, never any
// ranking, winner, significance, or "leading" notion. Metric formatting reuses
// the existing insights MetricFormat + formatValue() so cells render identically
// to the rest of the app.
//
// TODO: wire to API. No campaign/variant endpoint exists yet — the shapes below
// are the seam a real fetch should fill (see data.ts for the mock + hook).

import type { MetricFormat } from "@/lib/insights/types"

export type CampaignStatus = "ended" | "running" | "paused"

// A column in the comparison table. `kind` distinguishes the always-present
// fixed metrics from the per-campaign custom ones; both render the same way.
export interface CampaignMetric {
  id: string
  label: string
  format: MetricFormat
  kind: "fixed" | "custom"
  // Section the metric is shown under (e.g. "Calls", "Tasks"). Drives the
  // grouped spec-sheet layout; falls back to a kind-based bucket if absent.
  group?: string
}

// The fields a variant overrode relative to the base/control agent. Kept on the
// model for completeness; the results page renders the table only.
export interface VariantOverrides {
  voice?: string
  llm?: string
  greeting?: string
}

export interface Variant {
  id: string
  name: string
  isControl: boolean
  overrides: VariantOverrides
  // Logged value per metric id. `null` = insufficient/missing data → renders "—",
  // never 0. Absent keys are treated the same as null.
  metrics: Record<string, number | null>
}

export interface CampaignResult {
  id: string
  name: string
  status: CampaignStatus
  totalCalls: number
  dateRange: { start: string; end: string } // ISO dates
  // Column set for THIS campaign, fixed metrics first then custom. The table
  // builds its columns from this array — nothing is hardcoded.
  metrics: CampaignMetric[]
  variants: Variant[]
}
