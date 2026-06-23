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

export function ChartTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Table</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="px-2 py-2 text-left font-medium">Month</th>
              <th className="px-2 py-2 text-right font-medium">Desktop</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((row) => (
              <tr key={row.month} className="border-b last:border-0">
                <td className="px-2 py-2.5">{row.month}</td>
                <td className="px-2 py-2.5 text-right tabular-nums">
                  {row.desktop.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
