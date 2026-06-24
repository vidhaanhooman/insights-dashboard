"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface ComboboxCtx {
  items: readonly string[]
  value?: string
  select: (v: string) => void
  query: string
  setQuery: (q: string) => void
  open: boolean
  setOpen: (o: boolean) => void
}

const Ctx = React.createContext<ComboboxCtx | null>(null)
function useCombobox() {
  const c = React.useContext(Ctx)
  if (!c) throw new Error("Combobox parts must render inside <Combobox>")
  return c
}

function matches(item: string, query: string) {
  return item.toLowerCase().includes(query.trim().toLowerCase())
}

export function Combobox({
  items = [],
  value,
  onValueChange,
  className,
  children,
}: {
  items?: readonly string[]
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const select = (v: string) => {
    onValueChange?.(v)
    setOpen(false)
    setQuery("")
  }
  return (
    <Ctx.Provider value={{ items, value, select, query, setQuery, open, setOpen }}>
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (!o) setQuery("")
        }}
      >
        <div className={cn("relative", className)}>{children}</div>
      </Popover>
    </Ctx.Provider>
  )
}

export function ComboboxInput({
  placeholder,
  className,
}: {
  placeholder?: string
  className?: string
}) {
  const { value } = useCombobox()
  return (
    <PopoverTrigger asChild>
      <button
        type="button"
        className={cn(
          "flex h-8 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-2.5 text-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          value ? "text-text" : "text-text-muted",
          className
        )}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
      </button>
    </PopoverTrigger>
  )
}

export function ComboboxContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <PopoverContent
      align="start"
      sideOffset={4}
      className={cn(
        "w-[var(--radix-popover-trigger-width)] min-w-0 p-0",
        className
      )}
    >
      <div className="scroll-thin max-h-56 overflow-y-auto p-1">{children}</div>
    </PopoverContent>
  )
}

export function ComboboxEmpty({ children }: { children: React.ReactNode }) {
  const { items, query } = useCombobox()
  if (items.some((i) => matches(i, query))) return null
  return (
    <div className="px-3 py-6 text-center text-xs text-text-muted">{children}</div>
  )
}

export function ComboboxList({
  children,
}: {
  children: (item: string) => React.ReactNode
}) {
  const { items, query } = useCombobox()
  return <>{items.filter((i) => matches(i, query)).map((item) => children(item))}</>
}

export function ComboboxItem({
  value: itemValue,
  children,
}: {
  value: string
  children: React.ReactNode
}) {
  const { value, select } = useCombobox()
  const selected = value === itemValue
  return (
    <button
      type="button"
      onClick={() => select(itemValue)}
      className={cn(
        "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-surface-2",
        selected && "bg-surface-2 text-text"
      )}
    >
      <span className="truncate">{children}</span>
      {selected && <Check className="size-3.5 shrink-0" />}
    </button>
  )
}
