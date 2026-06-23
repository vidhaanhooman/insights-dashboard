// Layer 1 of the three-layer model: Metric (data definition) → Widget (visualization) → Dashboard (layout).

export type MetricFormat = "count" | "percent" | "ratio" | "duration" | "currency"

// "system" metrics are built-in and protected; custom metrics are owned by a userId.
export type MetricOwner = "system" | (string & {})

export type MetricSource =
  | { kind: "system"; key: string }
  | { kind: "derived"; expr: string }
  | { kind: "filtered"; baseKey: string; where: FilterClause[] }
  | { kind: "grouped"; baseKey: string; groupBy: GroupField }

export type FilterClause = { field: GroupField; value: string }
export type GroupField = "outcome" | "agent"

export interface Metric {
  id: string
  label: string
  owner: MetricOwner
  format: MetricFormat
  source: MetricSource
}

export type WidgetType = "number" | "line" | "bar" | "pie" | "table"

export type ViewByGranularity = "Hour" | "Day" | "Month"

export interface WidgetConfig {
  groupBy?: string
  viewBy?: ViewByGranularity
}

export interface Widget {
  id: string
  type: WidgetType
  metricIds: string[]
  title: string
  owner: MetricOwner
  span: 1 | 2
  config: WidgetConfig
  dataSource?: string
  timeRange?: TimeRange
  persistTimeRange?: boolean
}

export interface Dashboard {
  id: string
  name: string
  widgetIds: string[]
}

export type TimeRange = "today" | "7d" | "30d"

// Standard async result shape every data hook returns — the seam a real API swaps into.
export interface DataResult<T> {
  data: T
  loading: boolean
}
