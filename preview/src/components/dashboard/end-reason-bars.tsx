import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { endReasons, type EndReason } from "./chart-data";

const toneColor: Record<EndReason["tone"], string> = {
  good: "var(--chart-2)",
  neutral: "var(--chart-1)",
  warn: "var(--chart-3)",
  bad: "var(--destructive)",
};

export function EndReasonBars() {
  const max = Math.max(...endReasons.map((r) => r.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">End reason wise count</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {endReasons.map((r) => (
          <div key={r.reason}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{r.reason}</span>
              <span className="font-medium tabular-nums">{r.count}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{ width: `${(r.count / max) * 100}%`, background: toneColor[r.tone] }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
