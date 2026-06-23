"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  DataTable,
  type Column,
  type ExpandableChartProps,
  type Row,
} from "@/components/dashboard/expandable-chart"
import type { ChartType } from "@/components/dashboard/chart-type-picker"

const monthlyData: Row[] = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const monthlyColumns: Column[] = [
  { key: "month", label: "Month" },
  { key: "desktop", label: "Desktop", numeric: true },
  { key: "mobile", label: "Mobile", numeric: true },
]

const browserData: Row[] = [
  { browser: "chrome", visitors: 275 },
  { browser: "safari", visitors: 200 },
  { browser: "firefox", visitors: 187 },
  { browser: "edge", visitors: 173 },
  { browser: "other", visitors: 90 },
]

const browserColumns: Column[] = [
  { key: "browser", label: "Browser" },
  { key: "visitors", label: "Visitors", numeric: true },
]

const seriesConfig = {
  desktop: { label: "Desktop", color: "var(--chart-1)" },
  mobile: { label: "Mobile", color: "var(--chart-2)" },
} satisfies ChartConfig

const pieConfig = {
  visitors: { label: "Visitors" },
  chrome: { label: "Chrome", color: "var(--chart-1)" },
  safari: { label: "Safari", color: "var(--chart-2)" },
  firefox: { label: "Firefox", color: "var(--chart-3)" },
  edge: { label: "Edge", color: "var(--chart-4)" },
  other: { label: "Other", color: "var(--chart-5)" },
} satisfies ChartConfig

function renderLine(data: Row[]) {
  return (
    <ChartContainer config={seriesConfig} className="h-[260px] w-full">
      <LineChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => String(value).slice(0, 3)}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Line
          dataKey="desktop"
          type="monotone"
          stroke="var(--color-desktop)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="mobile"
          type="monotone"
          stroke="var(--color-mobile)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  )
}

function renderBar(data: Row[]) {
  return (
    <ChartContainer config={seriesConfig} className="h-[260px] w-full">
      <BarChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => String(value).slice(0, 3)}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={6} />
        <Bar dataKey="mobile" fill="var(--color-mobile)" radius={6} />
      </BarChart>
    </ChartContainer>
  )
}

function renderPie(data: Row[]) {
  const withFill = data.map((d, i) => ({
    ...d,
    fill: `var(--chart-${i + 1})`,
  }))
  return (
    <ChartContainer
      config={pieConfig}
      className="mx-auto aspect-square max-h-[260px] [&_.recharts-pie-label-text]:fill-foreground"
    >
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Pie data={withFill} dataKey="visitors" nameKey="browser" label />
      </PieChart>
    </ChartContainer>
  )
}

function renderNumber(data: Row[]) {
  const total = data.reduce((sum, d) => sum + Number(d.desktop ?? 0), 0)
  return (
    <div>
      <div className="text-5xl font-semibold tabular-nums tracking-tight">
        {total.toLocaleString()}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Total desktop visitors
      </p>
    </div>
  )
}

function renderTable(data: Row[]) {
  return <DataTable columns={monthlyColumns} data={data} />
}

export const chartViews: Record<ChartType, ExpandableChartProps> = {
  number: {
    title: "Total visitors",
    description: "January - June 2024",
    columns: monthlyColumns,
    initialData: monthlyData,
    renderChart: renderNumber,
  },
  line: {
    title: "Line Chart",
    description: "January - June 2024",
    columns: monthlyColumns,
    initialData: monthlyData,
    renderChart: renderLine,
  },
  bar: {
    title: "Bar Chart",
    description: "January - June 2024",
    columns: monthlyColumns,
    initialData: monthlyData,
    renderChart: renderBar,
  },
  pie: {
    title: "Pie Chart",
    description: "January - June 2024",
    columns: browserColumns,
    initialData: browserData,
    renderChart: renderPie,
  },
  table: {
    title: "Table",
    description: "January - June 2024",
    columns: monthlyColumns,
    initialData: monthlyData,
    renderChart: renderTable,
  },
}
