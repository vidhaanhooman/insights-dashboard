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
import { SegmentedToggle } from "./segmented-toggle"

const config = {
  Inbound: { label: "Inbound", color: "#4164ff" },
  Outbound: { label: "Outbound", color: "#fe6237" },
  Web: { label: "Web", color: "#ffb62e" },
  Tasks: { label: "Tasks created", color: "#7cc3ff" },
} satisfies ChartConfig

type SeriesKey = keyof typeof config
const SERIES = Object.keys(config) as SeriesKey[]
const OPTIONS = SERIES.map((key) => ({
  value: key,
  label: config[key].label,
  color: config[key].color,
}))

function ChartBody({
  data,
  active,
  height,
}: {
  data: ConversationPoint[]
  active: SeriesKey
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
        <ChartTooltip content={<ChartTooltipContent className="w-[160px]" />} />
        <Line
          dataKey={active}
          type="monotone"
          stroke={`var(--color-${active})`}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
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
  const [active, setActive] = React.useState<SeriesKey>("Outbound")
  const { data, loading } = useConversations(range, refreshKey)

  const total = React.useMemo(
    () => data.reduce((sum, d) => sum + d[active], 0),
    [data, active]
  )

  const pill = (
    <SegmentedToggle
      options={OPTIONS}
      value={active}
      onChange={(v) => setActive(v as SeriesKey)}
      size="sm"
    />
  )

  return (
    <>
      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="flex flex-col gap-3 border-b px-5 py-3.5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Conversations &amp; Tasks</span>
            <span className="text-2xl font-semibold leading-none tabular-nums">
              {total.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            {pill}
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground"
              aria-label="Enlarge"
              onClick={() => setOpen(true)}
            >
              <Maximize2 className="size-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <ChartBody data={data} active={active} height={300} />
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Conversations &amp; Tasks</DialogTitle>
          </DialogHeader>
          {pill}
          <ChartBody data={data} active={active} height={460} />
        </DialogContent>
      </Dialog>
    </>
  )
}
