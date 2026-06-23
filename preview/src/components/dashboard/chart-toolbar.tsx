"use client"

import * as React from "react"

import { DateRangePicker } from "@/components/date-range-picker"
import { AgentPicker } from "./agent-picker"

// Toolbar for enlarged chart views — mirrors the main page filters (date + agent).
export function ChartToolbar() {
  const [start, setStart] = React.useState("2026-06-16T00:00")
  const [end, setEnd] = React.useState("2026-06-23T23:59")
  const [agentId, setAgentId] = React.useState("")

  return (
    <div className="flex flex-wrap items-center gap-3">
      <DateRangePicker
        startValue={start}
        endValue={end}
        onApply={(s, e) => {
          setStart(s)
          setEnd(e)
        }}
      />
      <AgentPicker agentId={agentId} onChange={setAgentId} />
    </div>
  )
}
