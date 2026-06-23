// Replace these with your real API data. Shapes match what the charts below expect.

export type CallPoint = { time: string; attempted: number; connected: number };

export const callsOverTime: CallPoint[] = [
  { time: "12 AM", attempted: 0, connected: 0 },
  { time: "2 AM", attempted: 1, connected: 0 },
  { time: "4 AM", attempted: 0, connected: 0 },
  { time: "6 AM", attempted: 0, connected: 0 },
  { time: "8 AM", attempted: 1, connected: 1 },
  { time: "10 AM", attempted: 1, connected: 1 },
  { time: "12 PM", attempted: 2, connected: 1 },
  { time: "1 PM", attempted: 12, connected: 9 },
  { time: "2 PM", attempted: 5, connected: 4 },
  { time: "3 PM", attempted: 5, connected: 4 },
  { time: "5 PM", attempted: 2, connected: 1 },
  { time: "7 PM", attempted: 1, connected: 1 },
  { time: "9 PM", attempted: 1, connected: 0 },
  { time: "11 PM", attempted: 0, connected: 0 },
];

export type OutcomeSlice = { outcome: string; count: number; fill: string };

// fill references the CSS vars defined in globals.css (--chart-1..5)
export const outcomeWise: OutcomeSlice[] = [
  { outcome: "Voicemail", count: 38, fill: "var(--chart-1)" },
  { outcome: "Answered", count: 31, fill: "var(--chart-2)" },
  { outcome: "No response", count: 19, fill: "var(--chart-3)" },
  { outcome: "Busy", count: 12, fill: "var(--chart-4)" },
];

export type EndReason = { reason: string; count: number; tone: "good" | "neutral" | "warn" | "bad" };

export const endReasons: EndReason[] = [
  { reason: "Completed", count: 12, tone: "good" },
  { reason: "No answer", count: 6, tone: "neutral" },
  { reason: "Busy", count: 3, tone: "warn" },
  { reason: "Failed", count: 2, tone: "bad" },
];

export type Kpi = {
  label: string;
  value: string;
  delta?: { value: string; direction: "up" | "down" | "flat" };
};

export const kpis: Kpi[] = [
  { label: "Calls attempted", value: "1,284", delta: { value: "12.4%", direction: "up" } },
  { label: "Connected", value: "847", delta: { value: "8.1%", direction: "up" } },
  { label: "Pickup rate", value: "66.0%", delta: { value: "2.3%", direction: "down" } },
  { label: "Avg duration", value: "2m 41s", delta: { value: "vs. yesterday", direction: "flat" } },
];
