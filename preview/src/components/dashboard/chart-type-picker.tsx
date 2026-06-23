"use client"

import { useState } from "react"
import { ChartLine, ChartBar, ChartPie, Table as TableIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type ChartType = "number" | "line" | "bar" | "pie" | "table"

const OPTIONS: { value: ChartType; label: string; icon: React.ReactNode }[] = [
  { value: "number", label: "Number", icon: <span className="text-base font-semibold tracking-tight">123</span> },
  { value: "line", label: "Line", icon: <ChartLine className="size-5" /> },
  { value: "bar", label: "Bar", icon: <ChartBar className="size-5" /> },
  { value: "pie", label: "Pie", icon: <ChartPie className="size-5" /> },
  { value: "table", label: "Table", icon: <TableIcon className="size-5" /> },
]

export function ChartTypePicker({
  value,
  onChange,
}: {
  value?: ChartType
  onChange?: (value: ChartType) => void
}) {
  const [internal, setInternal] = useState<ChartType>("number")
  const selected = value ?? internal

  function select(next: ChartType) {
    setInternal(next)
    onChange?.(next)
  }

  return (
    <div role="radiogroup" aria-label="Chart type" className="flex gap-3">
      {OPTIONS.map((opt) => {
        const active = selected === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => select(opt.value)}
            className={cn(
              "flex h-20 w-24 flex-col items-center justify-center gap-1.5 rounded-xl border bg-card text-muted-foreground transition-colors",
              "hover:bg-accent hover:text-foreground",
              active
                ? "border-destructive text-foreground ring-1 ring-destructive"
                : "border-border"
            )}
          >
            <span className="flex h-6 items-center justify-center">{opt.icon}</span>
            <span className="text-sm">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
