"use client"

import * as React from "react"
import { RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const PRESETS = ["1h", "3h", "12h", "1d", "3d", "1w"]

// Minimal CloudWatch-style toolbar for enlarged chart views. Self-contained /
// presentational — wire to the data layer when it's real.
export function ChartToolbar() {
  const [preset, setPreset] = React.useState("3h")

  return (
    <div className="flex flex-wrap items-center gap-1">
      <div className="flex items-center gap-0.5">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setPreset(p)}
            className={cn(
              "rounded-md px-2 py-1 text-sm transition-colors",
              preset === p
                ? "font-medium text-text"
                : "text-text-muted hover:text-text"
            )}
          >
            {p}
          </button>
        ))}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="ml-auto size-8 text-text-muted"
        aria-label="Refresh"
      >
        <RefreshCw className="size-3.5" />
      </Button>
    </div>
  )
}
