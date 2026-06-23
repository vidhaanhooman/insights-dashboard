"use client"

import { cn } from "@/lib/utils"

export interface SegmentOption {
  value: string
  label: string
  color?: string
}

// Standard segmented pill toggle used across the dashboard (series switch,
// view modes, etc.). Active option gets the raised pill treatment.
export function SegmentedToggle({
  options,
  value,
  onChange,
  className,
  size = "default",
}: {
  options: SegmentOption[]
  value: string
  onChange: (value: string) => void
  className?: string
  size?: "default" | "sm"
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center rounded-md border border-border-strong bg-surface-2 p-0.5",
        className
      )}
    >
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md text-xs transition-colors",
              size === "sm" ? "h-7 px-2.5" : "h-7 px-3",
              active
                ? "bg-white text-black shadow-sm"
                : "text-text-dim hover:text-text"
            )}
          >
            {opt.color && (
              <span
                className="size-2 rounded-full"
                style={{ background: opt.color }}
              />
            )}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
