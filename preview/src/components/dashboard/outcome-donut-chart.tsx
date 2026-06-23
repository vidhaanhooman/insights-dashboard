"use client";

import { Label, Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { outcomeWise } from "./chart-data";

const chartConfig = {
  count: { label: "Calls" },
  Voicemail: { label: "Voicemail", color: "var(--chart-1)" },
  Answered: { label: "Answered", color: "var(--chart-2)" },
  "No response": { label: "No response", color: "var(--chart-3)" },
  Busy: { label: "Busy", color: "var(--chart-4)" },
} satisfies ChartConfig;

export function OutcomeDonutChart() {
  const total = outcomeWise.reduce((sum, s) => sum + s.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Outcome wise connected</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <ChartContainer config={chartConfig} className="aspect-square h-[160px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={outcomeWise}
              dataKey="count"
              nameKey="outcome"
              innerRadius={48}
              outerRadius={70}
              strokeWidth={2}
            >
              <Label
                content={({ viewBox }) =>
                  viewBox && "cx" in viewBox ? (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan x={viewBox.cx} className="fill-foreground text-xl font-medium">
                        {total}
                      </tspan>
                      <tspan x={viewBox.cx} dy={18} className="fill-muted-foreground text-xs">
                        calls
                      </tspan>
                    </text>
                  ) : null
                }
              />
            </Pie>
          </PieChart>
        </ChartContainer>

        <ul className="flex-1 space-y-1.5 text-xs">
          {outcomeWise.map((s) => (
            <li key={s.outcome} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="size-2.5 rounded-[2px]" style={{ background: s.fill }} />
                {s.outcome}
              </span>
              <span className="font-medium tabular-nums">
                {Math.round((s.count / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
