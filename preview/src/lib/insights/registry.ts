import {
  BarChart3,
  Grid3x3,
  Hash,
  PieChart,
  Table as TableIcon,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"
import type { Metric, Widget, WidgetType } from "./types"

export const SYSTEM_METRICS: Metric[] = [
  { id: "calls", label: "Calls attempted", owner: "system", format: "count", source: { kind: "system", key: "calls" } },
  { id: "connected", label: "Connected call count", owner: "system", format: "count", source: { kind: "system", key: "connected" } },
  { id: "pickup", label: "Pickup rate", owner: "system", format: "percent", source: { kind: "derived", expr: "connected/calls" } },
  { id: "avgdur", label: "Avg duration", owner: "system", format: "duration", source: { kind: "system", key: "avgdur" } },
  { id: "turns", label: "Turns", owner: "system", format: "count", source: { kind: "system", key: "turns" } },
  { id: "init_fail", label: "Call initiation failed count", owner: "system", format: "count", source: { kind: "system", key: "init_fail" } },
  { id: "stt_cost", label: "STT cost", owner: "system", format: "currency", source: { kind: "system", key: "stt_cost" } },
  { id: "fail_rate", label: "Call failure rate", owner: "system", format: "percent", source: { kind: "derived", expr: "failed/calls" } },
  { id: "convs", label: "Conversation count", owner: "system", format: "count", source: { kind: "system", key: "convs" } },
  { id: "llm_cost", label: "LLM cost", owner: "system", format: "currency", source: { kind: "system", key: "llm_cost" } },
  { id: "avg_resp_len", label: "Avg response length", owner: "system", format: "count", source: { kind: "system", key: "avg_resp_len" } },
  { id: "unique_callers", label: "Unique callers (inbound)", owner: "system", format: "count", source: { kind: "system", key: "unique_callers" } },
  { id: "voicemail_count", label: "Voicemail call count", owner: "system", format: "count", source: { kind: "system", key: "voicemail_count" } },
  { id: "voicemail_rate", label: "Voicemail rate", owner: "system", format: "percent", source: { kind: "derived", expr: "voicemail/calls" } },
  { id: "agent_interrupts", label: "Agent interruption frequency", owner: "system", format: "count", source: { kind: "system", key: "agent_interrupts" } },
]

export const VIZ: { type: WidgetType; label: string; Icon: LucideIcon }[] = [
  { type: "number", label: "Number", Icon: Hash },
  { type: "line", label: "Line", Icon: TrendingUp },
  { type: "bar", label: "Bar", Icon: BarChart3 },
  { type: "pie", label: "Pie", Icon: PieChart },
  { type: "table", label: "Table", Icon: TableIcon },
  { type: "heatmap", label: "Heatmap", Icon: Grid3x3 },
]

// Types that show a single metric (no group-by) in the builder.
export const SCALAR_TYPES: WidgetType[] = ["number", "heatmap"]

// Primary KPIs get hero treatment; the rest fill the secondary grid.
export const HERO_WIDGET_IDS = ["w1", "w2"]

export const DEFAULT_WIDGETS: Widget[] = [
  { id: "w1", type: "number", metricIds: ["calls"], title: "Calls attempted", owner: "system", span: 1, config: {} },
  { id: "w2", type: "number", metricIds: ["connected"], title: "Calls connected", owner: "system", span: 1, config: {} },
  { id: "w3", type: "number", metricIds: ["pickup"], title: "Pickup rate", owner: "system", span: 1, config: {} },
  { id: "w4", type: "number", metricIds: ["avgdur"], title: "Avg duration", owner: "system", span: 1, config: {} },
  { id: "w5", type: "line", metricIds: ["calls"], title: "Calls attempted & connected", owner: "system", span: 2, config: {} },
  { id: "w6", type: "pie", metricIds: ["calls"], title: "Outcome breakdown", owner: "system", span: 1, config: { groupBy: "outcome" } },
  { id: "w7", type: "bar", metricIds: ["calls"], title: "Calls by agent", owner: "system", span: 1, config: { groupBy: "agent" } },
  { id: "w8", type: "table", metricIds: ["calls"], title: "Agent wise data", owner: "system", span: 2, config: {} },
]

export const SPAN_FOR_TYPE = (type: WidgetType): 1 | 2 =>
  type === "line" || type === "table" || type === "heatmap" ? 2 : 1
