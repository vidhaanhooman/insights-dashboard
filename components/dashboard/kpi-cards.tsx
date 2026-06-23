import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { kpis, type Kpi } from "./chart-data";

function Delta({ delta }: { delta?: Kpi["delta"] }) {
  if (!delta) return null;
  if (delta.direction === "flat") {
    return <span className="text-xs text-muted-foreground">{delta.value}</span>;
  }
  const up = delta.direction === "up";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs",
        up ? "text-emerald-500" : "text-rose-500"
      )}
    >
      {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
      {delta.value}
    </span>
  );
}

export function KpiCards({ items = kpis }: { items?: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((k) => (
        <div key={k.label} className="rounded-lg bg-muted/50 p-4">
          <p className="text-[13px] text-muted-foreground">{k.label}</p>
          <p className="mt-1.5 text-2xl font-medium tabular-nums">{k.value}</p>
          <div className="mt-1">
            <Delta delta={k.delta} />
          </div>
        </div>
      ))}
    </div>
  );
}
