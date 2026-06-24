"use client"

import { useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts"
import {
  BarChart3,
  Calendar,
  CreditCard,
  Download,
  Home,
  Landmark,
  Plus,
  Search,
  ShoppingCart,
  Tag,
  Users,
  Wallet,
} from "lucide-react"

import {
  formatCAD,
  PAYMENT_TYPES,
  RANGE_LABEL,
  SERIES,
  STATS,
  TOTAL,
  TRANSACTIONS,
} from "@/lib/transactions/data"

const DONUT_COLORS = ["#1d6fe0", "#5b9bf0", "#9cc4f7"]

const NAV = [
  { icon: Home, label: "Home" },
  { icon: ShoppingCart, label: "Orders" },
  { icon: Users, label: "Customers" },
  { icon: Users, label: "Users" },
  { icon: Tag, label: "Prices" },
  { icon: CreditCard, label: "Transactions", active: true },
  { icon: BarChart3, label: "Analytics" },
]

const STAT_ICONS = [CreditCard, CreditCard, Wallet, Landmark]

const AMOUNT_PILL = "bg-[#e7f0fd] text-[#1859b5]"

export function TransactionsDashboard() {
  const [view, setView] = useState<"range" | "daily">("daily")

  return (
    <div
      data-theme="light"
      className="flex min-h-screen flex-col bg-[#f6f7f9] text-[#0f172a]"
      style={{ colorScheme: "light" }}
    >
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-4 bg-[#0b1b34] px-5 text-white">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#37b6f0] to-[#1d6fe0] text-[13px] font-semibold">
            ◍
          </span>
          <span className="text-[15px] font-semibold tracking-tight">High Clean</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/70">
            Beta
          </span>
        </div>

        <div className="mx-auto flex h-9 w-full max-w-md items-center gap-2 rounded-lg bg-white/10 px-3 text-sm text-white/70">
          <Search className="size-4" />
          <input
            placeholder="Search..."
            className="w-full bg-transparent text-sm text-white placeholder:text-white/50 outline-none"
          />
          <kbd className="ml-auto rounded bg-white/15 px-1.5 py-0.5 text-[10px]">Ctrl K</kbd>
        </div>

        <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-[#37b6f0] to-[#1d6fe0] text-[11px] font-semibold">
          V
        </span>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="flex w-56 shrink-0 flex-col border-r border-[#e6e8ec] bg-[#fbfbfc] px-3 py-4">
          <div className="px-2 text-[11px] font-medium uppercase tracking-wide text-[#9aa3b2]">
            Orders
          </div>
          <button className="mt-2 flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-[#1d6fe0]">
            <Plus className="size-4" /> New Order
          </button>

          <div className="mt-5 px-2 text-[11px] font-medium uppercase tracking-wide text-[#9aa3b2]">
            Pages
          </div>
          <nav className="mt-2 flex flex-col gap-0.5">
            {NAV.map((item) => (
              <a
                key={item.label}
                className={`relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                  item.active
                    ? "bg-[#eaf2fd] font-medium text-[#1859b5]"
                    : "text-[#475569] hover:bg-[#f0f2f5]"
                }`}
              >
                {item.active && (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-[#1d6fe0]" />
                )}
                <item.icon className="size-4" />
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mt-auto flex items-center gap-2 border-t border-[#e6e8ec] pt-3">
            <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-[#37b6f0] to-[#1d6fe0] text-[11px] font-semibold text-white">
              V
            </span>
            <span className="truncate text-xs text-[#64748b]">vidhandubey03@gmail.com</span>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-x-hidden px-7 py-6">
          <nav className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
            <span>Admin</span>
            <span>/</span>
            <span className="text-[#475569]">Transactions</span>
          </nav>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="mt-1 text-sm text-[#64748b]">
            View insights and reports on your business transactions.
          </p>

          {/* View toggle */}
          <div className="mt-5 inline-flex items-center gap-1 rounded-lg border border-[#e6e8ec] bg-white p-1">
            <button
              onClick={() => setView("range")}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                view === "range"
                  ? "bg-[#0b1b34] text-white"
                  : "text-[#475569] hover:bg-[#f0f2f5]"
              }`}
            >
              Date range
            </button>
            <button
              onClick={() => setView("daily")}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                view === "daily"
                  ? "bg-[#0b1b34] text-white"
                  : "text-[#475569] hover:bg-[#f0f2f5]"
              }`}
            >
              Daily
            </button>
          </div>

          {/* Sub-toolbar */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold">Payments from {RANGE_LABEL}</h2>
            <div className="flex items-center gap-2.5">
              <button className="flex items-center gap-1.5 text-sm text-[#475569] hover:text-[#0f172a]">
                Download csv <Download className="size-3.5" />
              </button>
              <div className="flex items-center gap-2 rounded-lg border border-[#e6e8ec] bg-white px-3 py-1.5 text-sm text-[#475569]">
                <Calendar className="size-4 text-[#94a3b8]" />
                {RANGE_LABEL}
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {STATS.map((s, i) => {
              const Icon = STAT_ICONS[i]
              return (
                <div
                  key={s.key}
                  className="rounded-xl border border-[#e6e8ec] bg-white p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#64748b]">{s.label}</span>
                    <Icon className="size-4 text-[#94a3b8]" />
                  </div>
                  <div className="mt-2 text-xl font-semibold tracking-tight">
                    {formatCAD(s.value)}
                  </div>
                </div>
              )
            })}
            <div className="rounded-xl border border-[#bcd7fb] bg-[#eaf2fd] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#1859b5]">Total</span>
                <span className="flex size-4 items-center justify-center rounded-full bg-[#1d6fe0] text-[10px] text-white">
                  i
                </span>
              </div>
              <div className="mt-2 text-xl font-semibold tracking-tight text-[#0b1b34]">
                {formatCAD(TOTAL)}
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Area */}
            <div className="rounded-xl border border-[#e6e8ec] bg-white p-5 lg:col-span-2">
              <h3 className="text-sm font-semibold">Payments from {RANGE_LABEL}</h3>
              <p className="mt-0.5 text-xs text-[#94a3b8]">
                Showing total payments received in the selected date range
              </p>
              <div className="mt-4 h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={SERIES} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1d6fe0" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#1d6fe0" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#eef1f5" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <Tooltip
                      cursor={{ stroke: "#cbd5e1", strokeDasharray: "4 4" }}
                      content={({ active, payload, label }) =>
                        active && payload?.length ? (
                          <div className="rounded-lg border border-[#e6e8ec] bg-white px-3 py-2 text-xs shadow-sm">
                            <div className="font-medium text-[#0f172a]">{label}, 2024</div>
                            <div className="mt-1 flex items-center gap-6 text-[#64748b]">
                              <span>Amount</span>
                              <span className="font-medium text-[#0f172a]">
                                {formatCAD(Number(payload[0].value))}
                              </span>
                            </div>
                          </div>
                        ) : null
                      }
                    />
                    <Area
                      dataKey="amount"
                      type="monotone"
                      stroke="#1d6fe0"
                      strokeWidth={2}
                      fill="url(#fillAmount)"
                      activeDot={{ r: 4, fill: "#1d6fe0", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex items-center justify-center gap-2 text-xs text-[#64748b]">
                <span className="size-2.5 rounded-sm bg-[#1d6fe0]" /> Amount
              </div>
            </div>

            {/* Donut */}
            <div className="flex flex-col rounded-xl border border-[#e6e8ec] bg-white p-5">
              <h3 className="text-center text-sm font-semibold">Payment types</h3>
              <div className="relative mx-auto mt-3 h-[180px] w-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={PAYMENT_TYPES}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={86}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {PAYMENT_TYPES.map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) =>
                        active && payload?.length ? (
                          <div className="rounded-lg border border-[#e6e8ec] bg-white px-3 py-1.5 text-xs shadow-sm">
                            <span className="text-[#64748b]">{payload[0].name}: </span>
                            <span className="font-medium text-[#0f172a]">
                              {formatCAD(Number(payload[0].value))}
                            </span>
                          </div>
                        ) : null
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-center">
                <div className="text-sm font-semibold text-[#0b1b34]">
                  {formatCAD(TOTAL)} <span className="text-[#94a3b8]">↗</span>
                </div>
                <div className="text-xs text-[#94a3b8]">{RANGE_LABEL}</div>
              </div>
              <div className="mt-3 flex flex-col gap-1.5 border-t border-[#eef1f5] pt-3">
                {PAYMENT_TYPES.map((p, i) => (
                  <div key={p.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-[#64748b]">
                      <span
                        className="size-2.5 rounded-sm"
                        style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
                      />
                      {p.name}
                    </span>
                    <span className="font-medium text-[#0f172a]">{formatCAD(p.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="mt-4 rounded-xl border border-[#e6e8ec] bg-white">
            <div className="flex items-center justify-between px-5 py-4">
              <h3 className="text-sm font-semibold">Payments</h3>
              <button className="flex items-center gap-1.5 text-sm text-[#475569] hover:text-[#0f172a]">
                Export CSV <Download className="size-3.5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-[#eef1f5] text-left text-xs text-[#94a3b8]">
                    <th className="px-5 py-2.5 font-medium">ID</th>
                    <th className="px-5 py-2.5 font-medium">Order ID</th>
                    <th className="px-5 py-2.5 font-medium">Customer ID</th>
                    <th className="px-5 py-2.5 font-medium">Payment amount</th>
                    <th className="px-5 py-2.5 font-medium">Payment method</th>
                    <th className="px-5 py-2.5 font-medium">Created</th>
                    <th className="px-5 py-2.5 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {TRANSACTIONS.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-[#f1f3f6] last:border-0 hover:bg-[#fafbfc]"
                    >
                      <td className="px-5 py-3 text-[#475569]">{t.id}</td>
                      <td className="px-5 py-3 text-[#475569]">{t.orderId}</td>
                      <td className="px-5 py-3 text-[#475569]">{t.customerId}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-medium ${AMOUNT_PILL}`}
                        >
                          {formatCAD(t.amount)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[#475569]">{t.method}</td>
                      <td className="px-5 py-3 text-[#64748b]">{t.created}</td>
                      <td className="px-5 py-3 text-[#64748b]">{t.updated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
