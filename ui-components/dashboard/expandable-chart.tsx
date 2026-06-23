"use client"

import * as React from "react"
import { Maximize2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type Column = { key: string; label: string; numeric?: boolean }
export type Row = Record<string, string | number>

export type ExpandableChartProps = {
  title: string
  description?: string
  columns: Column[]
  initialData: Row[]
  renderChart: (data: Row[]) => React.ReactNode
  editable?: boolean
  footer?: React.ReactNode
}

export function DataTable({
  columns,
  data,
}: {
  columns: Column[]
  data: Row[]
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-muted-foreground">
          {columns.map((c) => (
            <th
              key={c.key}
              className={`px-2 py-2 font-medium ${c.numeric ? "text-right" : "text-left"}`}
            >
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} className="border-b last:border-0">
            {columns.map((c) => (
              <td
                key={c.key}
                className={`px-2 py-2.5 ${c.numeric ? "text-right tabular-nums" : ""}`}
              >
                {typeof row[c.key] === "number"
                  ? (row[c.key] as number).toLocaleString()
                  : row[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function EditTable({
  columns,
  data,
  onChange,
}: {
  columns: Column[]
  data: Row[]
  onChange: (rowIndex: number, key: string, value: number) => void
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-muted-foreground">
          {columns.map((c) => (
            <th
              key={c.key}
              className={`px-2 py-2 font-medium ${c.numeric ? "text-right" : "text-left"}`}
            >
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} className="border-b last:border-0">
            {columns.map((c) => (
              <td key={c.key} className="px-2 py-1.5">
                {c.numeric ? (
                  <Input
                    type="number"
                    value={row[c.key] as number}
                    onChange={(e) =>
                      onChange(i, c.key, Number(e.target.value) || 0)
                    }
                    className="h-8 text-right"
                  />
                ) : (
                  <span className="text-muted-foreground">{row[c.key]}</span>
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function ExpandableChart({
  title,
  description,
  columns,
  initialData,
  renderChart,
  editable = true,
  footer,
}: ExpandableChartProps) {
  const [data, setData] = React.useState<Row[]>(initialData)
  const [open, setOpen] = React.useState(false)

  function updateCell(rowIndex: number, key: string, value: number) {
    setData((prev) =>
      prev.map((row, i) => (i === rowIndex ? { ...row, [key]: value } : row))
    )
  }

  return (
    <>
      <Card className="relative">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Expand"
            onClick={() => setOpen(true)}
            className="absolute right-4 top-4 size-8 text-muted-foreground"
          >
            <Maximize2 className="size-4" />
          </Button>
        </CardHeader>
        <CardContent>{renderChart(data)}</CardContent>
        {footer ? <CardFooter>{footer}</CardFooter> : null}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
          </DialogHeader>

          <Tabs defaultValue="chart" className="w-full">
            <TabsList>
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="table">Table</TabsTrigger>
              {editable ? <TabsTrigger value="edit">Edit</TabsTrigger> : null}
            </TabsList>

            <TabsContent value="chart" className="pt-2">
              {renderChart(data)}
            </TabsContent>

            <TabsContent value="table" className="pt-2">
              <div className="max-h-[60vh] overflow-auto">
                <DataTable columns={columns} data={data} />
              </div>
            </TabsContent>

            {editable ? (
              <TabsContent value="edit" className="pt-2">
                <div className="max-h-[60vh] overflow-auto">
                  <EditTable
                    columns={columns}
                    data={data}
                    onChange={updateCell}
                  />
                </div>
              </TabsContent>
            ) : null}
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}
