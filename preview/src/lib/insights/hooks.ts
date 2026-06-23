"use client"

// The data-fetching seam. Today these wrap the synchronous mock resolver and
// fake a brief loading state; to go live, replace the bodies with your real
// API calls / query hooks — the return shape (DataResult<T>) stays the same and
// no widget component changes.

import * as React from "react"
import {
  resolveAgentTable,
  resolveConversations,
  resolveGrouped,
  resolveKpiSummary,
  resolveScalar,
  resolveSeries,
  type AgentRow,
  type ConversationPoint,
  type GroupPoint,
  type KpiSummary,
  type SeriesPoint,
} from "./resolver"
import type { DataResult, GroupField, Metric, TimeRange } from "./types"

// Brief loading whenever `key` changes. setState only fires inside the timeout
// (async), and the loading flag is derived during render — so no synchronous
// setState-in-effect and no cascading renders.
function useLoadingFor(key: string): boolean {
  const [readyKey, setReadyKey] = React.useState<string | null>(null)
  React.useEffect(() => {
    const id = setTimeout(() => setReadyKey(key), 220)
    return () => clearTimeout(id)
  }, [key])
  return readyKey !== key
}

export function useScalar(
  metric: Metric,
  range: TimeRange,
  refreshKey = 0
): DataResult<{ value: number }> {
  const loading = useLoadingFor(`scalar|${metric.id}|${range}|${refreshKey}`)
  const data = React.useMemo(
    () => ({ value: resolveScalar(metric, range) }),
    // refreshKey intentionally re-runs resolution when the user hits Refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [metric, range, refreshKey]
  )
  return { data, loading }
}

export function useSeries(
  range: TimeRange,
  refreshKey = 0
): DataResult<SeriesPoint[]> {
  const loading = useLoadingFor(`series|${range}|${refreshKey}`)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const data = React.useMemo(() => resolveSeries(range), [range, refreshKey])
  return { data, loading }
}

export function useGrouped(
  field: GroupField,
  range: TimeRange,
  refreshKey = 0
): DataResult<GroupPoint[]> {
  const loading = useLoadingFor(`grouped|${field}|${range}|${refreshKey}`)
  const data = React.useMemo(
    () => resolveGrouped(field, range),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [field, range, refreshKey]
  )
  return { data, loading }
}

export function useAgentTable(
  range: TimeRange,
  refreshKey = 0
): DataResult<AgentRow[]> {
  const loading = useLoadingFor(`agents|${range}|${refreshKey}`)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const data = React.useMemo(() => resolveAgentTable(range), [range, refreshKey])
  return { data, loading }
}

export function useConversations(
  range: TimeRange,
  refreshKey = 0
): DataResult<ConversationPoint[]> {
  const loading = useLoadingFor(`conversations|${range}|${refreshKey}`)
  const data = React.useMemo(
    () => resolveConversations(range),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [range, refreshKey]
  )
  return { data, loading }
}

export function useKpiSummary(
  range: TimeRange,
  refreshKey = 0
): DataResult<KpiSummary> {
  const loading = useLoadingFor(`kpi|${range}|${refreshKey}`)
  const data = React.useMemo(
    () => resolveKpiSummary(range),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [range, refreshKey]
  )
  return { data, loading }
}
