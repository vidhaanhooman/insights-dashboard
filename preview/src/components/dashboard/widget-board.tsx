"use client"

import * as React from "react"
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { cn } from "@/lib/utils"
import type { Widget } from "@/lib/insights/types"

export interface BoardLayout {
  w: number
  h: number
}

const ROW_H = 112
const GAP = 16

/** Column count + cell width derived from the live container width. */
function useGrid(ref: React.RefObject<HTMLDivElement | null>) {
  const [cols, setCols] = React.useState(4)
  const [cellW, setCellW] = React.useState(0)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const w = el.clientWidth
      const c = w < 640 ? 1 : w < 1024 ? 2 : 4
      setCols(c)
      setCellW((w - GAP * (c - 1)) / c)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])

  return { cols, cellW }
}

function SortableWidget({
  id,
  layout,
  cols,
  cellW,
  onResize,
  children,
}: {
  id: string
  layout: BoardLayout
  cols: number
  cellW: number
  onResize: (id: string, layout: BoardLayout) => void
  children: React.ReactNode
}) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } =
    useSortable({ id })

  const spanW = Math.min(layout.w, cols)
  const start = React.useRef<{ x: number; y: number; w: number; h: number } | null>(
    null
  )

  function onPointerDown(e: React.PointerEvent) {
    e.preventDefault()
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    start.current = { x: e.clientX, y: e.clientY, w: layout.w, h: layout.h }
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!start.current) return
    const dCol = Math.round((e.clientX - start.current.x) / (cellW + GAP))
    const dRow = Math.round((e.clientY - start.current.y) / (ROW_H + GAP))
    const w = Math.min(cols, Math.max(1, start.current.w + dCol))
    const h = Math.max(1, Math.min(6, start.current.h + dRow))
    if (w !== layout.w || h !== layout.h) onResize(id, { w, h })
  }
  function onPointerUp(e: React.PointerEvent) {
    start.current = null
    try {
      ;(e.target as Element).releasePointerCapture(e.pointerId)
    } catch {}
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        gridColumn: `span ${spanW}`,
        gridRow: `span ${layout.h}`,
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
      }}
      className={cn("group/board relative", isDragging && "opacity-85")}
    >
      <div
        {...attributes}
        {...listeners}
        className="h-full cursor-grab touch-none active:cursor-grabbing"
      >
        {children}
      </div>

      {/* Resize handle — snaps to grid columns/rows. */}
      <div
        role="slider"
        aria-label="Resize widget"
        aria-valuenow={spanW}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="absolute -bottom-0.5 -right-0.5 z-10 flex size-5 cursor-se-resize items-end justify-end p-1 opacity-0 transition-opacity group-hover/board:opacity-100"
      >
        <span className="block size-2.5 border-b-2 border-r-2 border-text-muted" />
      </div>
    </div>
  )
}

export function WidgetBoard({
  widgets,
  layouts,
  onReorder,
  onResize,
  renderItem,
}: {
  widgets: Widget[]
  layouts: Record<string, BoardLayout>
  onReorder: (orderedIds: string[]) => void
  onResize: (id: string, layout: BoardLayout) => void
  renderItem: (widget: Widget) => React.ReactNode
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const { cols, cellW } = useGrid(ref)
  // Drag only starts after a small move, so taps on header buttons still click.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )
  const ids = widgets.map((w) => w.id)

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = ids.indexOf(active.id as string)
    const to = ids.indexOf(over.id as string)
    if (from < 0 || to < 0) return
    onReorder(arrayMove(ids, from, to))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div
          ref={ref}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridAutoRows: `${ROW_H}px`,
            gap: GAP,
          }}
        >
          {widgets.map((w) => (
            <SortableWidget
              key={w.id}
              id={w.id}
              layout={layouts[w.id] ?? { w: 1, h: 2 }}
              cols={cols}
              cellW={cellW}
              onResize={onResize}
            >
              {renderItem(w)}
            </SortableWidget>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

/** Sensible starting size per widget type. */
export function defaultLayout(type: Widget["type"]): BoardLayout {
  switch (type) {
    case "number":
      return { w: 1, h: 1 }
    case "line":
      return { w: 2, h: 3 }
    case "table":
      return { w: 2, h: 3 }
    case "heatmap":
      return { w: 2, h: 3 }
    default:
      return { w: 1, h: 3 }
  }
}
