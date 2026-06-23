"use client"

import * as React from "react"
import {
  Bell,
  Check,
  Copy,
  Download,
  Maximize2,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import type { MetricOwner } from "@/lib/insights/types"
import { cn } from "@/lib/utils"

export interface WidgetControls {
  onRename?: (title: string) => void
  onEdit?: () => void
  onExpand?: () => void
  onRemove?: () => void
  onDuplicate?: () => void
  onRefresh?: () => void
}

interface WidgetShellProps extends WidgetControls {
  title: string
  owner: MetricOwner
  children: React.ReactNode
  pad?: boolean
}

export function WidgetShell({
  title,
  owner,
  onRename,
  onEdit,
  onExpand,
  onRemove,
  onDuplicate,
  onRefresh,
  children,
  pad = true,
}: WidgetShellProps) {
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(title)
  const isCustom = owner !== "system"

  function startRename() {
    setDraft(title)
    setEditing(true)
  }
  function commit() {
    const v = draft.trim()
    if (v && onRename) onRename(v)
    setEditing(false)
  }

  return (
    <Card className="group h-full gap-0 overflow-hidden py-0">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 border-b px-3.5 py-2 [.border-b]:pb-2">
        {editing ? (
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit()
              if (e.key === "Escape") setEditing(false)
            }}
            className="h-7 flex-1 text-sm"
          />
        ) : (
          <span className="text-sm font-medium">{title}</span>
        )}

        <div className="ml-auto flex items-center gap-0.5">
          {editing ? (
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              aria-label="Save name"
              onClick={commit}
            >
              <Check className="size-4" />
            </Button>
          ) : (
            <>
              {onRefresh && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 text-muted-foreground"
                  aria-label="Refresh"
                  onClick={onRefresh}
                >
                  <RefreshCw className="size-3.5" />
                </Button>
              )}
              {onExpand && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 text-muted-foreground"
                  aria-label="Enlarge"
                  onClick={onExpand}
                >
                  <Maximize2 className="size-3.5" />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 text-muted-foreground"
                    aria-label="More actions"
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {onEdit && (
                    <DropdownMenuItem onSelect={onEdit}>
                      <SlidersHorizontal /> Edit…
                    </DropdownMenuItem>
                  )}
                  {onRename && (
                    <DropdownMenuItem onSelect={startRename}>
                      <Pencil /> Rename
                    </DropdownMenuItem>
                  )}
                  {onDuplicate && (
                    <DropdownMenuItem onSelect={onDuplicate}>
                      <Copy /> Duplicate
                    </DropdownMenuItem>
                  )}
                  {/* TODO(stub): wire up image export */}
                  <DropdownMenuItem disabled>
                    <Download /> Download image
                  </DropdownMenuItem>
                  {/* TODO(stub): wire up alarm creation */}
                  <DropdownMenuItem disabled>
                    <Bell /> Create alarm
                  </DropdownMenuItem>
                  {/* System widgets are protected from deletion */}
                  {onRemove && isCustom && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onSelect={onRemove}>
                        <Trash2 /> Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className={cn(pad ? "p-3.5" : "p-0", "flex-1")}>
        {children}
      </CardContent>
    </Card>
  )
}
