"use client"

import * as React from "react"

import { Switch } from "@/components/ui/switch"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

// Two-pane chart edit view: big chart on the left, a resizable settings rail on
// the right. Shared by every chart type's enlarge view.
export function ChartDetail({
  chart,
  children,
}: {
  chart: React.ReactNode
  children: React.ReactNode
}) {
  const [railWidth, setRailWidth] = React.useState(300)
  const drag = React.useRef<{ x: number; w: number } | null>(null)
  const down = (e: React.PointerEvent) => {
    e.preventDefault()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, w: railWidth }
  }
  const move = (e: React.PointerEvent) => {
    if (!drag.current) return
    const w = drag.current.w - (e.clientX - drag.current.x)
    setRailWidth(Math.max(240, Math.min(640, w)))
  }
  const up = (e: React.PointerEvent) => {
    drag.current = null
    try {
      ;(e.target as Element).releasePointerCapture(e.pointerId)
    } catch {}
  }

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center pr-3">
        {chart}
      </div>
      <div
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        role="separator"
        aria-label="Resize panel"
        className="group/handle relative w-2 shrink-0 cursor-col-resize touch-none"
      >
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border transition-colors group-hover/handle:w-0.5 group-hover/handle:bg-ring" />
      </div>
      <aside
        style={{ width: railWidth }}
        className="flex shrink-0 flex-col gap-5 overflow-y-auto pl-5"
      >
        {children}
      </aside>
    </div>
  )
}

export function RailGroup({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2.5">
      <p className="text-[11px] font-medium text-text-muted">{label}</p>
      {children}
    </div>
  )
}

export function RailToggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-text-dim">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

export function RailCombo({
  label,
  value,
  onChange,
  items,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  items: readonly string[]
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-text-dim">{label}</span>
      <Combobox
        items={items}
        value={value}
        onValueChange={onChange}
        className="w-[150px]"
      >
        <ComboboxInput placeholder="Select" />
        <ComboboxContent>
          <ComboboxEmpty>No items found.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}

export function RailColors({
  names,
  colorFor,
  onPick,
}: {
  names: string[]
  colorFor: (i: number) => string
  onPick: (i: number, hex: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {names.map((n, i) => (
        <label
          key={i}
          title={n}
          className="relative size-7 cursor-pointer overflow-hidden rounded-md border border-border-strong"
          style={{ background: colorFor(i) }}
        >
          <input
            type="color"
            value={colorFor(i)}
            onChange={(e) => onPick(i, e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      ))}
    </div>
  )
}

/** Per-cell color override state + resolver, shared by chart edit views. */
export function useChartColors(palette: string[]) {
  const [colors, setColors] = React.useState<Record<number, string>>({})
  const colorFor = (i: number) => colors[i] ?? palette[i % palette.length]
  const pick = (i: number, hex: string) =>
    setColors((c) => ({ ...c, [i]: hex }))
  return { colorFor, pick }
}
