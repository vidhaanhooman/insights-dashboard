"use client"

// Post-campaign comparison — read-only, informational.
//
// Deliberately neutral: no winner, ranking, "leading"/"best" labels, no primary
// metric, no significance/confidence, no color-coded best/worst, no promote
// action. Every variant column and every cell carries identical visual weight.
// Metric rows are grouped into sections built dynamically from the campaign's
// metric set (fixed + custom) — nothing about the column/row list is hardcoded.

import * as React from "react"
import { ChevronRight } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { formatValue } from "@/lib/insights/resolver"
import { useCampaignResult } from "@/lib/campaigns/data"
import type {
  CampaignMetric,
  CampaignResult,
  CampaignStatus,
  Variant,
} from "@/lib/campaigns/types"
import { cn } from "@/lib/utils"
import { AppSidebar } from "@/components/dashboard/app-sidebar"

const STATUS_LABEL: Record<CampaignStatus, string> = {
  ended: "Ended",
  running: "Running",
  paused: "Paused",
}

// State indicator only (campaign lifecycle), unrelated to variant comparison.
const STATUS_DOT: Record<CampaignStatus, string> = {
  ended: "bg-text-muted",
  running: "bg-blue-400",
  paused: "bg-amber-400",
}

function formatDateRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
  const s = new Date(start).toLocaleDateString("en-US", opts)
  const e = new Date(end).toLocaleDateString("en-US", { ...opts, year: "numeric" })
  return `${s} – ${e}`
}

// Shared grid template so the header row and every spec row align by column.
function colTemplate(variantCount: number): string {
  return `minmax(190px,1.4fr) repeat(${variantCount}, minmax(150px,1fr))`
}

function PageHeader({ result }: { result: CampaignResult }) {
  return (
    <div>
      <h1 className="text-xl font-semibold text-text">{result.name}</h1>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[result.status])} />
          {STATUS_LABEL[result.status]}
        </span>
        <span className="text-text-dim">·</span>
        <span>
          <span className="tabular-nums text-text-dim">
            {result.totalCalls.toLocaleString()}
          </span>{" "}
          calls collected
        </span>
        <span className="text-text-dim">·</span>
        <span>{formatDateRange(result.dateRange.start, result.dateRange.end)}</span>
      </div>
    </div>
  )
}

// Sticky top row of variant identities — one column per variant.
function VariantHeaderRow({
  variants,
  template,
  onOpen,
}: {
  variants: Variant[]
  template: string
  onOpen: (id: string) => void
}) {
  return (
    <div
      className="grid items-end border-b border-border-strong"
      style={{ gridTemplateColumns: template }}
    >
      <div className="sticky left-0 z-10 bg-surface px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
        Variant
      </div>
      {variants.map((v) => (
        <button
          key={v.id}
          onClick={() => onOpen(v.id)}
          className="group flex flex-col items-start gap-1 px-4 py-3 text-left transition-colors hover:bg-surface-2/40"
        >
          <span className="flex items-center gap-1.5">
            {v.isControl && (
              <span className="rounded border border-border-strong px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
                Control
              </span>
            )}
          </span>
          <span className="flex w-full items-center gap-1 text-sm font-medium text-text">
            <span className="truncate">{v.name}</span>
            <ChevronRight
              size={14}
              className="shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
            />
          </span>
        </button>
      ))}
    </div>
  )
}

function SectionTitle({ label }: { label: string }) {
  return (
    <div className="border-b border-border bg-surface-2/30 px-4 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
      {label}
    </div>
  )
}

// One metric → a value per variant. Cells are uniform; no emphasis anywhere.
function MetricRow({
  metric,
  variants,
  template,
}: {
  metric: CampaignMetric
  variants: Variant[]
  template: string
}) {
  return (
    <div
      className="grid items-center border-b border-border last:border-0"
      style={{ gridTemplateColumns: template }}
    >
      <div className="sticky left-0 z-10 bg-surface px-4 py-3 text-sm text-text-muted">
        {metric.label}
      </div>
      {variants.map((v) => {
        const raw = v.metrics[metric.id]
        const value = raw == null ? null : raw
        return (
          <div
            key={v.id}
            className="px-4 py-3 text-sm tabular-nums text-text-dim"
          >
            {formatValue(value, metric.format)}
          </div>
        )
      })}
    </div>
  )
}

function SpecSheet({ result }: { result: CampaignResult }) {
  // TODO: wire to a per-variant detail route (transcripts / recordings /
  // per-call) when one exists. No such route today, so this is a stub.
  function openVariant(variantId: string) {
    // eslint-disable-next-line no-console
    console.log("[campaign-results] drill into variant (stub):", variantId)
  }

  const template = colTemplate(result.variants.length)

  // Group metrics by their section, preserving first-seen order. Fully driven by
  // the metric set — fixed and custom alike.
  const groups: { label: string; metrics: CampaignMetric[] }[] = []
  for (const m of result.metrics) {
    const label = m.group ?? (m.kind === "custom" ? "Custom metrics" : "Metrics")
    let g = groups.find((x) => x.label === label)
    if (!g) {
      g = { label, metrics: [] }
      groups.push(g)
    }
    g.metrics.push(m)
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-lg border border-border-strong">
      <div className="min-w-fit">
        <VariantHeaderRow
          variants={result.variants}
          template={template}
          onOpen={openVariant}
        />
        {groups.map((g) => (
          <section key={g.label}>
            <SectionTitle label={g.label} />
            {g.metrics.map((m) => (
              <MetricRow
                key={m.id}
                metric={m}
                variants={result.variants}
                template={template}
              />
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}

function LoadingSheet() {
  return (
    <div className="mt-6 rounded-lg border border-border-strong">
      <div className="border-b border-border-strong px-4 py-3">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="space-y-3 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="mt-6 rounded-lg border border-dashed border-border-strong px-6 py-14 text-center">
      <p className="text-sm font-medium text-text">No calls collected yet</p>
      <p className="mx-auto mt-1 max-w-sm text-xs text-text-muted">
        Variant metrics will appear here once calls have been logged for this
        campaign.
      </p>
    </div>
  )
}

export function CampaignResults({
  campaignId = "camp_collections_q2",
}: {
  campaignId?: string
}) {
  const { data, loading } = useCampaignResult(campaignId)
  const hasData =
    data.variants.length > 0 &&
    data.variants.some((v) => (v.metrics.calls ?? 0) > 0)

  return (
    <div className="dark flex min-h-screen bg-background text-foreground">
      <AppSidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b px-5 py-3.5">
          <span className="text-[15px] font-semibold">Campaign results</span>
          <span className="rounded-md border border-border-strong bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-text-muted">
            Read-only
          </span>
        </header>

        <div className="px-7 py-6">
          {loading ? (
            <>
              <Skeleton className="h-7 w-64" />
              <Skeleton className="mt-2 h-4 w-80" />
              <LoadingSheet />
            </>
          ) : (
            <>
              <PageHeader result={data} />
              {hasData ? <SpecSheet result={data} /> : <EmptyState />}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
