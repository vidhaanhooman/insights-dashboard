"use client"

import * as React from "react"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface FilterRow {
  id: string
  field: string
  op: string
  value: string
}

export const FILTER_FIELDS = ["outcome", "agent", "type", "status", "direction"]
export const OPERATORS = ["==", "!=", ">", "<", ">=", "<=", "contains"]

let _fid = 0
export function newFilter(): FilterRow {
  return { id: `flt${++_fid}`, field: "outcome", op: "==", value: "" }
}

function MiniSelect({
  value,
  options,
  onChange,
  className,
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
  className?: string
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("h-9 w-full min-w-0", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// Grouped Where/And condition builder — shared by the widget builder and the
// chart edit views so they stay identical.
export function FilterBuilder({
  filters,
  onChange,
}: {
  filters: FilterRow[]
  onChange: (filters: FilterRow[]) => void
}) {
  const patch = (id: string, p: Partial<FilterRow>) =>
    onChange(filters.map((f) => (f.id === id ? { ...f, ...p } : f)))
  const remove = (id: string) => onChange(filters.filter((f) => f.id !== id))
  const add = () => onChange([...filters, newFilter()])

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium">Filters</p>
        {filters.length > 0 && (
          <span className="text-xs text-text-muted">
            {filters.length} condition{filters.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {filters.length === 0 ? (
        <button
          type="button"
          onClick={add}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong py-3 text-sm text-text-muted transition-colors hover:border-text-muted hover:text-text"
        >
          <Plus className="size-4" /> Add a filter
        </button>
      ) : (
        <div className="space-y-2 rounded-lg border border-border bg-surface-2/30 p-2.5">
          {filters.map((f, i) => (
            <div key={f.id} className="group flex items-center gap-2">
              <span className="w-9 shrink-0 text-xs font-medium text-text-muted">
                {i === 0 ? "Where" : "And"}
              </span>
              <MiniSelect
                value={f.field}
                options={FILTER_FIELDS}
                onChange={(v) => patch(f.id, { field: v })}
                className="flex-1"
              />
              <MiniSelect
                value={f.op}
                options={OPERATORS}
                onChange={(v) => patch(f.id, { op: v })}
                className="w-[76px] shrink-0"
              />
              <Input
                value={f.value}
                onChange={(e) => patch(f.id, { value: e.target.value })}
                placeholder="Value"
                className="h-9 min-w-0 flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                aria-label="Remove filter"
                onClick={() => remove(f.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <button
            type="button"
            onClick={add}
            className="flex items-center gap-1.5 px-1 pt-0.5 text-sm text-text-dim transition-colors hover:text-text"
          >
            <Plus className="size-4" /> Add filter
          </button>
        </div>
      )}
    </div>
  )
}
