import { CallsAreaChart } from "./calls-area-chart";
import { EndReasonBars } from "./end-reason-bars";
import { KpiCards } from "./kpi-cards";
import { OutcomeDonutChart } from "./outcome-donut-chart";

// Drop this into your Outbound tab content area.
export function InsightsOverview() {
  return (
    <div className="space-y-4">
      <KpiCards />

      <CallsAreaChart />

      <div className="grid gap-4 lg:grid-cols-2">
        <OutcomeDonutChart />
        <EndReasonBars />
      </div>
    </div>
  );
}
