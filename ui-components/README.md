# UI components

A bundled snapshot of every UI component used in the Insights dashboard, copied
from the runnable app at [`../preview`](../preview). Use this folder as a
reference / drop-in source; the live, wired-up versions live in `preview/`.

## Layout

- **`ui/`** — shadcn/ui primitives (Radix-based): button, card, dialog, popover,
  select, dropdown-menu, checkbox, table, badge, input, label, switch, tabs,
  skeleton, separator, collapsible, chart.
- **`dashboard/`** — the product components built on top of the primitives:
  - `insights-dashboard.tsx` — the app shell (sidebar + tabbed header + range/agent filter).
  - `app-sidebar.tsx`, `segmented-toggle.tsx`, `dropdown.tsx`, `agent-picker.tsx`, `chart-toolbar.tsx`.
  - `kpi-strip.tsx`, `conversations-chart.tsx` — Overview default content.
  - `outbound-view.tsx`, `inbound-view.tsx` + `views/panels.tsx` — the default Outbound/Inbound dashboards (StatCards / LinePanel / PiePanel / TablePanel).
  - `widget-builder.tsx` — the Add/Edit Widget modal (visualization, data source, time range, group-by, metrics + filters).
  - `widgets/` — the configurable widget renderers: `metric-card`, `line-widget`, `bar-widget`, `pie-widget`, `table-widget`, `metric-breakdown`, `widget-shell`, `widget-renderer`, `stat-body`.
- **`insights-data/`** — the data layer the components read from: `types.ts`,
  `mock-data.ts`, `resolver.ts`, `hooks.ts`, `registry.ts`. Swap `mock-data` +
  the hook bodies for a real API; nothing in the components changes.

## Conventions

- Tailwind + styleguide tokens (`surface`, `surface-2`, `text-dim`, `text-muted`,
  `border-strong`, `--chart-1..5`, …). shadcn tokens are mapped onto these.
- Charts are Recharts via the shadcn `chart` wrappers; categorical palette is
  shades of blue.
- Import aliases in the source use `@/components/...` and `@/lib/insights/...`
  (as in `preview/`). Adjust paths if you relocate these files.

> Note: this is a copy for reference. Edit the originals under `preview/src/` to
> change the running app.
