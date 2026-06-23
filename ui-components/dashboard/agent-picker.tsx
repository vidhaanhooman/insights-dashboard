"use client";

import { useMemo, useState } from "react";
import { Bot, Check, Filter, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface AgentDetail {
  id: string;
  name: string;
  mode: "Conversation" | "Broadcast";
}

const AGENT_DETAILS: AgentDetail[] = [
  { id: "agt_debt_pitch", name: "Debt Collection Pitch Agent", mode: "Conversation" },
  { id: "agt_debt_outbound", name: "Debt Collection Outbound Agent", mode: "Broadcast" },
  { id: "agt_careers360", name: "Careers_360 - Tech college predictor", mode: "Conversation" },
  { id: "agt_premium", name: "premium", mode: "Conversation" },
  { id: "agt_standard", name: "standard", mode: "Broadcast" },
  { id: "agt_palmonas", name: "palmonas hoomanlabs", mode: "Broadcast" },
];

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
        checked ? "border-white bg-white text-black" : "border-border-strong",
      )}
    >
      {checked && <Check size={11} strokeWidth={3} />}
    </span>
  );
}

const SURFACE_BG = { backgroundColor: "var(--surface)" } as const;
const CARD = "rounded-lg border border-border-strong shadow-xl shadow-black/40";

export function AgentPicker({
  agentId,
  onChange,
  className,
}: {
  agentId: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const agent = AGENT_DETAILS.find((a) => a.id === agentId);
  const filtered = useMemo(() => {
    if (!query.trim()) return AGENT_DETAILS;
    const q = query.toLowerCase();
    return AGENT_DETAILS.filter(
      (a) =>
        a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={className}>
          <Filter className="size-3.5" />
          Filter
          {agent && (
            <span className="ml-1 max-w-[140px] truncate text-text-muted">
              · {agent.name}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        style={SURFACE_BG}
        className={cn(CARD, "w-[380px] overflow-hidden p-0")}
      >
        <div className="flex flex-col">
          <div className="flex h-11 items-center gap-2 border-b border-border px-4">
            <Bot size={13} className="text-text-muted" />
            <span className="text-sm font-medium text-text">Agent</span>
            <span className="ml-auto font-mono text-[11px] text-text-muted">
              {filtered.length}
            </span>
          </div>
          <div className="border-b border-border p-2">
            <div className="flex h-9 items-center gap-2 rounded-md border border-border-strong bg-transparent px-2.5">
              <Search size={13} className="shrink-0 text-text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search agents…"
                className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
              />
            </div>
          </div>
          <div className="scroll-thin max-h-[260px] overflow-y-auto px-2 py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-8 text-center text-xs text-text-muted">
                No agents match &ldquo;{query}&rdquo;
              </div>
            ) : (
              filtered.map((a) => {
                const selected = a.id === agentId;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      onChange(a.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                      selected
                        ? "bg-surface-2 text-text"
                        : "text-text-dim hover:bg-surface-2/60 hover:text-text",
                    )}
                  >
                    <Checkbox checked={selected} />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-sm leading-tight",
                          selected ? "font-medium text-text" : "text-text-dim",
                        )}
                      >
                        {a.name}
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-[11px] leading-tight text-text-muted">
                        {a.id}
                      </span>
                    </span>
                    <span className="inline-flex h-5 shrink-0 items-center rounded-md border border-border-strong bg-surface px-2 text-[10px] text-text-muted">
                      {a.mode}
                    </span>
                  </button>
                );
              })
            )}
          </div>
          <div className="flex items-center justify-between border-t border-border p-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={!agentId}
              onClick={() => {
                onChange("")
                setOpen(false)
              }}
            >
              Clear
            </Button>
            <span className="px-1 text-[11px] text-text-muted">
              {agentId ? "1 selected" : "None selected"}
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
