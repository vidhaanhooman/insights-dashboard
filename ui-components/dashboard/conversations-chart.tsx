"use client"

import * as React from "react"
import { Maximize2 } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { useConversations } from "@/lib/insights/hooks"
import type { ConversationPoint } from "@/lib/insights/resolver"
import type { TimeRange } from "@/lib/insights/types"
import { cn } from "@/lib/utils"
import { ChartToolbar } from "./chart-toolbar"

const config = {
  Inbound: { label: "Inbound", color: "#3a6ae6" },
  Outbound: { label: "Outbound", color: "#6f9cf6" },
  Web: { label: "Web", color: "#2546b3" },
  Tasks: { label: "Tasks created", color: "#a9caff" },
} satisfies ChartConfig

type SeriesKey = keyof typeof config
const SERIES = Object.keys(config) as SeriesKey[]

function MultiLine({
  data,
  visible,
  height,
}: {
  data: ConversationPoint[]
  visible: Set<SeriesKey>
  height: number
}) {
  return (
    <ChartContainer config={config} className="w-full" style={{ height }}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          minTickGap={24}
        />
        <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent className="w-[170px]" />} />
        {SERIES.filter((k) => visible.has(k)).map((key) => (
          <Line
            key={key}
            dataKey={key}
            type="monotone"
            stroke={`var(--color-${key})`}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ChartContainer>
  )
}

export function ConversationsChart({
  range,
  refreshKey,
}: {
  range: TimeRange
  refreshKey: number
}) {
  const [open, setOpen] = React.useState(false)
  const [visible, setVisible] = React.useState<Set<SeriesKey>>(
    () => new Set(SERIES)
  )

  const { data, loading } = useConversations(range, refreshKey)

  const total = React.useMemo(() => {
    let sum = 0
    for (const d of data)
      for (const k of SERIES) if (visible.has(k)) sum += d[k]
    return sum
  }, [data, visible])

  // Click a series to isolate it; click the isolated one again to restore all.
  function isolate(key: SeriesKey) {
    setVisible((prev) =>
      prev.size === 1 && prev.has(key) ? new Set(SERIES) : new Set([key])
    )
  }

  const legend = (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs">
      {SERIES.map((key) => {
        const on = visible.has(key)
        return (
          <button
            key={key}
            onClick={() => isolate(key)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-opacity hover:bg-surface-2",
              on ? "text-text" : "text-text-muted opacity-40"
            )}
          >
            <span
              className="size-2 rounded-full"
              style={{ background: config[key].color }}
            />
            {config[key].label}
          </button>
        )
      })}
    </div>
  )

  return (
    <>
      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="flex flex-row items-center gap-4 border-b px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Conversations &amp; Tasks</span>
            <span className="text-2xl font-bold leading-none tabular-nums">
              {total.toLocaleString()}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto size-7 text-text-muted"
            aria-label="Enlarge"
            onClick={() => setOpen(true)}
          >
            <Maximize2 className="size-3.5" />
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <MultiLine data={data} visible={visible} height={300} />
          )}
          <div className="mt-2 flex justify-center">{legend}</div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Conversations &amp; Tasks</DialogTitle>
          </DialogHeader>

          <ChartToolbar />
          <MultiLine data={data} visible={visible} height={420} />
          <div className="flex justify-center">{legend}</div>
        </DialogContent>
      </Dialog>
    </>
  )
}

