"use client"

import * as React from "react"

import { RangeDatePicker } from "@/components/range-date-picker"
import { AgentPicker } from "./agent-picker"

// Toolbar for enlarged chart views — mirrors the overview page filters (date + agent).
export function ChartToolbar() {
  const [from, setFrom] = React.useState("2026-06-16")
  const [to, setTo] = React.useState("2026-06-23")
  const [agentId, setAgentId] = React.useState("")

  return (
    <div className="flex flex-wrap items-center gap-2">
      <RangeDatePicker
        from={from}
        to={to}
        onChange={(f, t) => {
          setFrom(f)
          setTo(t)
        }}
      />
      <AgentPicker agentId={agentId} onChange={setAgentId} />
    </div>
  )
}
