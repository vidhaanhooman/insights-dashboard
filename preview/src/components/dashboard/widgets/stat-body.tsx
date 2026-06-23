import type { LucideIcon } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// Shared stat presentation: icon + label header, big value centered below.
// Used by the Number widget and the Inbound summary cards so they stay identical.
export function StatBody({
  icon: Icon,
  label,
  value,
  loading = false,
  muted = false,
  hero = false,
}: {
  icon: LucideIcon
  label: string
  value: string
  loading?: boolean
  muted?: boolean
  hero?: boolean
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1.5 text-sm font-medium text-text-muted">
        <Icon size={15} className="shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <div className="flex flex-1 items-center pt-3">
        {loading ? (
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
        )}
      </div>
    </div>
  )
}
