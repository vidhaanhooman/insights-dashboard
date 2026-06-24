// Mock data for the Transactions dashboard (light-theme prototype).
// Swap these for a real API later — the shape is intentionally simple.

export interface DayPoint {
  date: string // "Dec 3"
  amount: number
}

export interface PaymentTypeSlice {
  name: string
  value: number
}

export interface TransactionRow {
  id: number
  orderId: number
  customerId: number
  amount: number
  method: "Credit" | "Cash" | "Debit" | "Store credit"
  created: string
  updated: string
}

export const RANGE_LABEL = "Dec 2, 2024 - Dec 9, 2024"

export const STATS = [
  { key: "credit", label: "Credit card amount", value: 1153.62 },
  { key: "debit", label: "Debit card amount", value: 570.47 },
  { key: "cash", label: "Cash amount", value: 456.01 },
  { key: "store", label: "Store credit amount", value: 0 },
] as const

export const TOTAL = 2180.1

export const SERIES: DayPoint[] = [
  { date: "Dec 2", amount: 210.4 },
  { date: "Dec 3", amount: 268.9 },
  { date: "Dec 4", amount: 318.2 },
  { date: "Dec 5", amount: 444.81 },
  { date: "Dec 6", amount: 372.5 },
  { date: "Dec 7", amount: 256.3 },
  { date: "Dec 8", amount: 198.7 },
  { date: "Dec 9", amount: 110.27 },
]

export const PAYMENT_TYPES: PaymentTypeSlice[] = [
  { name: "Credit card", value: 1153.62 },
  { name: "Debit card", value: 570.47 },
  { name: "Cash", value: 456.01 },
]

export const TRANSACTIONS: TransactionRow[] = [
  { id: 295, orderId: 474, customerId: 304, amount: 28.48, method: "Credit", created: "Dec 2, 2024, 10:15 AM", updated: "Dec 2, 2024, 10:15 AM" },
  { id: 296, orderId: 401, customerId: 245, amount: 38.4, method: "Cash", created: "Dec 2, 2024, 11:41 AM", updated: "Dec 2, 2024, 11:41 AM" },
  { id: 297, orderId: 393, customerId: 237, amount: 30.77, method: "Credit", created: "Dec 2, 2024, 11:44 AM", updated: "Dec 2, 2024, 11:44 AM" },
  { id: 298, orderId: 348, customerId: 152, amount: 52.06, method: "Debit", created: "Dec 2, 2024, 12:46 PM", updated: "Dec 2, 2024, 12:46 PM" },
  { id: 299, orderId: 502, customerId: 318, amount: 19.99, method: "Store credit", created: "Dec 3, 2024, 09:02 AM", updated: "Dec 3, 2024, 09:02 AM" },
  { id: 300, orderId: 511, customerId: 290, amount: 64.2, method: "Credit", created: "Dec 3, 2024, 01:18 PM", updated: "Dec 3, 2024, 01:18 PM" },
  { id: 301, orderId: 478, customerId: 201, amount: 12.5, method: "Cash", created: "Dec 4, 2024, 10:33 AM", updated: "Dec 4, 2024, 10:33 AM" },
  { id: 302, orderId: 523, customerId: 333, amount: 88.9, method: "Debit", created: "Dec 4, 2024, 03:55 PM", updated: "Dec 4, 2024, 03:55 PM" },
  { id: 303, orderId: 540, customerId: 348, amount: 41.15, method: "Credit", created: "Dec 5, 2024, 08:47 AM", updated: "Dec 5, 2024, 08:47 AM" },
  { id: 304, orderId: 559, customerId: 360, amount: 27.3, method: "Cash", created: "Dec 5, 2024, 02:09 PM", updated: "Dec 5, 2024, 02:09 PM" },
]

export function formatCAD(n: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    currencyDisplay: "symbol",
  })
    .format(n)
    .replace("$", "$") // keep CA$ style from Intl ("CA$1,153.62")
}
