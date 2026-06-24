import type { LucideIcon } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// Shared stat presentation. Default stacks icon+label over a big value; the
// `row` variant puts the icon+label on the left and the value on the right.
// Used by the Number widget and the Inbound summary cards so they stay aligned.
export function StatBody({
  icon: Icon,
  label,
  value,
  loading = false,
  muted = false,
  hero = false,
  row = false,
}: {
  icon: LucideIcon
  label: string
  value: string
  loading?: boolean
  muted?: boolean
  hero?: boolean
  row?: boolean
}) {
  const labelRow = (
    <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-text-muted">
      <Icon size={row ? 20 : 15} className="shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  )

  const valueEl = loading ? (
    <Skeleton className={hero ? "h-9 w-28" : "h-8 w-24"} />
  ) : (
    <p
      className={cn(
        "font-bold leading-none tabular-nums text-text",
        hero ? "text-3xl" : "text-2xl",
        muted && "text-text-muted"
      )}
    >
      {value}
    </p>
  )

  if (row) {
    return (
      <div className="flex h-full items-center justify-between gap-3">
        {labelRow}
        {valueEl}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {labelRow}
      <div className="flex flex-1 items-center pt-3">{valueEl}</div>
    </div>
  )
}
