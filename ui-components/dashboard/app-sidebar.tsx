"use client"

import * as React from "react"
import {
  AlarmClock,
  BadgeCheck,
  Bot,
  ChevronsLeft,
  Database,
  FileText,
  FlaskConical,
  Globe,
  Hash,
  Headphones,
  LineChart,
  Megaphone,
  MessagesSquare,
  PhoneOff,
  ScrollText,
  Settings,
  Spline,
  Zap,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  icon: LucideIcon
  active?: boolean
  badge?: string
}
interface NavGroup {
  heading: string
  items: NavItem[]
}

const GROUPS: NavGroup[] = [
  {
    heading: "Build",
    items: [
      { label: "Overview", icon: Globe, active: true },
      { label: "Agents", icon: Bot },
      { label: "Test Agents", icon: Headphones },
      { label: "Simulation", icon: FlaskConical },
      { label: "QA", icon: BadgeCheck },
      { label: "Tools", icon: Zap },
      { label: "Library", icon: Database },
      { label: "Pronunciation", icon: Spline },
      { label: "Numbers", icon: Hash },
      { label: "DND", icon: PhoneOff, badge: "Beta" },
    ],
  },
  {
    heading: "Call",
    items: [{ label: "Campaigns", icon: Megaphone }],
  },
  {
    heading: "Logs",
    items: [
      { label: "Conversation Logs", icon: MessagesSquare },
      { label: "Execution Logs", icon: ScrollText },
    ],
  },
  {
    heading: "Monitor",
    items: [
      { label: "Alerts", icon: AlarmClock },
      { label: "Reports", icon: FileText },
      { label: "Insights", icon: LineChart },
    ],
  },
]

export function AppSidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-card/40 lg:flex">
      <div className="flex items-center gap-2 px-3 py-3">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
          HO
        </div>
        <span className="text-sm font-semibold">HoomanLabs</span>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto size-7 text-muted-foreground"
          aria-label="Collapse sidebar"
        >
          <ChevronsLeft className="size-4" />
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {GROUPS.map((group) => (
          <div key={group.heading} className="mt-4 first:mt-1">
            <p className="px-3 pb-1 text-[11px] font-medium text-text-muted">
              {group.heading}
            </p>
            {group.items.map((item) => (
              <button
                key={item.label}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                  item.active
                    ? "bg-surface-2 font-medium text-text"
                    : "text-text-dim hover:bg-surface-2/60 hover:text-text"
                )}
              >
                <item.icon size={15} className="shrink-0 text-text-muted" />
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto rounded bg-accent-dim px-1.5 py-0.5 text-[10px] font-medium text-brand">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t p-2">
        <button className="flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground">
          <Settings className="size-4" /> Settings
        </button>
        <div className="mt-2 flex items-center gap-2 rounded-md px-2 py-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-muted text-[11px] font-medium">
            TB
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">Toby Belhome</p>
            <p className="truncate text-[10px] text-muted-foreground">
              hello@hoomanlabs.com
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
