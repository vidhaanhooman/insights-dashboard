import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const chartData = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 73 },
  { month: "May", desktop: 209 },
  { month: "June", desktop: 214 },
]

export function ChartNumber() {
  const total = chartData.reduce((sum, d) => sum + d.desktop, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total visitors</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-5xl font-semibold tabular-nums tracking-tight">
          {total.toLocaleString()}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Across the last 6 months
        </p>
      </CardContent>
    </Card>
  )
}
