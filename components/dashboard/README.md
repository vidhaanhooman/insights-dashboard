# Insights dashboard — shadcn redesign

AWS CloudWatch-style retheme of the Outbound insights view: KPI stat cards, an
area chart (Attempted vs Connected), a donut with side legend, and a horizontal
bar list for end reasons.

## Install prerequisites

```bash
# shadcn primitives used here
npx shadcn@latest add card chart

# peer deps (chart pulls recharts; lucide is shadcn's icon set)
npm i recharts lucide-react
```

`npx shadcn@latest add chart` generates `components/ui/chart.tsx`
(`ChartContainer`, `ChartTooltip`, `ChartLegend`, etc.) — these files import from it.

## Wire up the theme

Copy the variables in `chart-theme.css` into your `app/globals.css`, merging them
into the existing `:root` and `.dark` blocks. They define `--chart-1..5`.

## Use it

```tsx
import { InsightsOverview } from "@/components/dashboard/insights-overview";

// inside your Outbound tab:
<InsightsOverview />
```

## Swap in real data

Everything reads from `chart-data.ts`. Replace the exported constants with your
API response (keep the same shapes), or lift them into props if you fetch
client-side. No chart component needs editing to change the numbers.

## Files

- `chart-data.ts` — typed sample data + shapes (the only file you edit for data)
- `kpi-cards.tsx` — top stat-card row with trend deltas
- `calls-area-chart.tsx` — dual-series area chart with gradient fills
- `outcome-donut-chart.tsx` — donut + center total + side legend with %
- `end-reason-bars.tsx` — ranked horizontal bar list
- `insights-overview.tsx` — composes the layout
- `chart-theme.css` — palette CSS variables to merge into globals.css
