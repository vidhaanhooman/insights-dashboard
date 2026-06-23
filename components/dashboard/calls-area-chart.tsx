"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { callsOverTime } from "./chart-data";

const chartConfig = {
  attempted: { label: "Attempted", color: "var(--chart-1)" },
  connected: { label: "Connected", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function CallsAreaChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Calls attempted & connected</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[240px] w-full">
          <AreaChart data={callsOverTime} margin={{ left: 4, right: 12, top: 8 }}>
            <defs>
              <linearGradient id="fillAttempted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-attempted)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--color-attempted)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="fillConnected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-connected)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--color-connected)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              className="text-xs"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={28}
              allowDecimals={false}
              className="text-xs"
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <Area
              dataKey="attempted"
              type="monotone"
              stroke="var(--color-attempted)"
              strokeWidth={2}
              fill="url(#fillAttempted)"
            />
            <Area
              dataKey="connected"
              type="monotone"
              stroke="var(--color-connected)"
              strokeWidth={2}
              fill="url(#fillConnected)"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
