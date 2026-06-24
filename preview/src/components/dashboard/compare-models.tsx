"use client"

import * as React from "react"
import {
  AudioLines,
  Check,
  ChevronsUpDown,
  Image as ImageIcon,
  Minus,
  Plus,
  Type,
  Video,
  X,
  Zap,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { AppSidebar } from "./app-sidebar"

// --- Model catalog -----------------------------------------------------------
// A spec sheet per model. Swap this for a real fetch later — the column UI
// renders straight off these fields.
type Modality = { text: boolean; image: boolean; audio: boolean; video: boolean }

interface ModelSpec {
  id: string
  name: string // dropdown label
  slug: string // big name on the hero card
  gradient: string
  blurb: string
  reasoning: number // 0–5
  speed: number // 0–5
  input: Modality
  output: Modality
  reasoningTokens: boolean
  pricing: { input: number; cachedInput: number | null; output: number }
  context: { window: number; maxOutput: number; cutoff: string }
  endpoints: { chat: boolean; responses: boolean; batch: boolean }
  features: {
    streaming: boolean
    functionCalling: boolean
    structuredOutputs: boolean
    imageInput: boolean
  }
}

const G_PINK = "linear-gradient(115deg,#f3a6c4 0%,#c98bf0 45%,#8a6cf0 100%)"
const G_ORANGE = "linear-gradient(115deg,#f7b27a 0%,#f288a6 50%,#c46cf0 100%)"
const G_AMBER = "linear-gradient(115deg,#f6c177 0%,#f0936b 45%,#d76ad0 100%)"
const G_BLUE = "linear-gradient(115deg,#7ec8f7 0%,#8a8cf0 50%,#c46cf0 100%)"
const G_TEAL = "linear-gradient(115deg,#7be0c8 0%,#6cb8f0 55%,#8a6cf0 100%)"

const CATALOG: ModelSpec[] = [
  {
    id: "gpt-5.5",
    name: "GPT-5.5",
    slug: "gpt-5.5",
    gradient: G_PINK,
    blurb: "A new class of intelligence for coding and professional work.",
    reasoning: 4,
    speed: 3,
    input: { text: true, image: true, audio: false, video: false },
    output: { text: true, image: false, audio: false, video: false },
    reasoningTokens: true,
    pricing: { input: 5, cachedInput: 0.5, output: 30 },
    context: { window: 1_050_000, maxOutput: 128_000, cutoff: "Dec 01, 2025" },
    endpoints: { chat: true, responses: true, batch: true },
    features: { streaming: true, functionCalling: true, structuredOutputs: true, imageInput: true },
  },
  {
    id: "gpt-5.5-pro",
    name: "GPT-5.5 Pro",
    slug: "gpt-5.5-pro",
    gradient: G_ORANGE,
    blurb: "Version of GPT-5.5 that produces smarter and more precise responses.",
    reasoning: 5,
    speed: 1,
    input: { text: true, image: true, audio: false, video: false },
    output: { text: true, image: false, audio: false, video: false },
    reasoningTokens: true,
    pricing: { input: 30, cachedInput: null, output: 180 },
    context: { window: 1_050_000, maxOutput: 128_000, cutoff: "Dec 01, 2025" },
    endpoints: { chat: false, responses: true, batch: true },
    features: { streaming: false, functionCalling: true, structuredOutputs: true, imageInput: true },
  },
  {
    id: "gpt-5.4",
    name: "GPT-5.4",
    slug: "gpt-5.4",
    gradient: G_AMBER,
    blurb: "A more affordable model for coding and professional work.",
    reasoning: 4,
    speed: 3,
    input: { text: true, image: true, audio: false, video: false },
    output: { text: true, image: false, audio: false, video: false },
    reasoningTokens: true,
    pricing: { input: 2.5, cachedInput: 0.25, output: 15 },
    context: { window: 1_050_000, maxOutput: 128_000, cutoff: "Aug 31, 2025" },
    endpoints: { chat: true, responses: true, batch: true },
    features: { streaming: true, functionCalling: true, structuredOutputs: true, imageInput: true },
  },
  {
    id: "gpt-5.4-mini",
    name: "GPT-5.4 mini",
    slug: "gpt-5.4-mini",
    gradient: G_BLUE,
    blurb: "Fast, lightweight model for high-volume, latency-sensitive tasks.",
    reasoning: 3,
    speed: 5,
    input: { text: true, image: true, audio: false, video: false },
    output: { text: true, image: false, audio: false, video: false },
    reasoningTokens: true,
    pricing: { input: 0.6, cachedInput: 0.06, output: 2.4 },
    context: { window: 400_000, maxOutput: 64_000, cutoff: "Aug 31, 2025" },
    endpoints: { chat: true, responses: true, batch: true },
    features: { streaming: true, functionCalling: true, structuredOutputs: true, imageInput: true },
  },
  {
    id: "gpt-5.4-realtime",
    name: "GPT-5.4 realtime",
    slug: "gpt-5.4-realtime",
    gradient: G_TEAL,
    blurb: "Speech-to-speech model for natural, low-latency voice agents.",
    reasoning: 3,
    speed: 5,
    input: { text: true, image: false, audio: true, video: false },
    output: { text: true, image: false, audio: true, video: false },
    reasoningTokens: false,
    pricing: { input: 4, cachedInput: 0.4, output: 16 },
    context: { window: 128_000, maxOutput: 16_000, cutoff: "Aug 31, 2025" },
    endpoints: { chat: false, responses: true, batch: false },
    features: { streaming: true, functionCalling: true, structuredOutputs: false, imageInput: false },
  },
]

const byId = (id: string) => CATALOG.find((m) => m.id === id)!

// --- Primitives --------------------------------------------------------------

function Dots({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "size-2.5 rounded-full",
            i < value ? "bg-text" : "border border-border-strong"
          )}
        />
      ))}
    </span>
  )
}

function Bolts({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Zap
          key={i}
          size={14}
          className={i < value ? "fill-text text-text" : "text-border-strong"}
        />
      ))}
    </span>
  )
}

function Modalities({ m }: { m: Modality }) {
  const items: [boolean, React.ReactNode][] = [
    [m.text, <Type key="t" size={13} />],
    [m.image, <ImageIcon key="i" size={13} />],
    [m.audio, <AudioLines key="a" size={13} />],
    [m.video, <Video key="v" size={13} />],
  ]
  return (
    <span className="flex items-center gap-1.5">
      {items.map(([on, icon], i) => (
        <span
          key={i}
          className={cn(
            "flex size-5 items-center justify-center rounded",
            on ? "text-text" : "text-text-muted/30"
          )}
        >
          {icon}
        </span>
      ))}
    </span>
  )
}

function Bool({ value }: { value: boolean }) {
  return value ? (
    <span className="flex size-4 items-center justify-center rounded-full bg-white text-black">
      <Check size={11} strokeWidth={3} />
    </span>
  ) : (
    <span className="flex size-4 items-center justify-center rounded-full border border-border-strong text-text-muted">
      <X size={9} strokeWidth={3} />
    </span>
  )
}

// A label/value spec line with a hairline divider.
function Row({
  label,
  children,
  mono,
}: {
  label: string
  children: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-3 text-sm">
      <span className="text-text-dim">{label}</span>
      <span
        className={cn(
          "shrink-0 text-text",
          mono && "font-mono tabular-nums"
        )}
      >
        {children}
      </span>
    </div>
  )
}

function SectionHeader({
  label,
  meta,
}: {
  label: string
  meta?: string
}) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-1.5 pt-6 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
      <span>{label}</span>
      {meta && <span>{meta}</span>}
    </div>
  )
}

const price = (n: number) => `$${n.toFixed(2)}`

// --- Column ------------------------------------------------------------------

function ModelColumn({
  modelId,
  onChange,
}: {
  modelId: string
  onChange: (id: string) => void
}) {
  const m = byId(modelId)

  return (
    <div className="flex min-w-0 flex-col">
      {/* Selector */}
      <div className="relative">
        <select
          value={modelId}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-full appearance-none rounded-md border border-border-strong bg-surface-2 px-3 pr-8 text-sm text-text outline-none focus:border-white"
        >
          {CATALOG.map((c) => (
            <option key={c.id} value={c.id} className="bg-surface text-text">
              {c.name}
            </option>
          ))}
        </select>
        <ChevronsUpDown
          size={14}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted"
        />
      </div>

      {/* Hero */}
      <div
        className="mt-3 flex h-[116px] items-center justify-center rounded-lg"
        style={{ backgroundImage: m.gradient }}
      >
        <span className="text-[26px] font-semibold text-white drop-shadow-sm">
          {m.slug}
        </span>
      </div>

      <p className="mt-3 min-h-[40px] text-sm leading-snug text-text-dim">
        {m.blurb}
      </p>

      {/* Actions */}
      <button className="mt-2 h-9 rounded-full border border-border-strong text-sm text-text transition-colors hover:bg-surface-2">
        Learn more
      </button>
      <button className="mt-2 h-9 rounded-full bg-white text-sm font-medium text-black transition-colors hover:bg-white/90">
        Playground
      </button>

      {/* Capabilities */}
      <div className="mt-5">
        <Row label="Reasoning">
          <Dots value={m.reasoning} />
        </Row>
        <Row label="Speed">
          <Bolts value={m.speed} />
        </Row>
        <Row label="Input">
          <Modalities m={m.input} />
        </Row>
        <Row label="Output">
          <Modalities m={m.output} />
        </Row>
        <Row label="Reasoning tokens">
          <Bool value={m.reasoningTokens} />
        </Row>
      </div>

      {/* Pricing */}
      <SectionHeader label="Pricing" meta="PER 1M TOKENS" />
      <Row label="Input" mono>
        {price(m.pricing.input)}
      </Row>
      <Row label="Cached Input" mono>
        {m.pricing.cachedInput == null ? "–" : price(m.pricing.cachedInput)}
      </Row>
      <Row label="Output" mono>
        {price(m.pricing.output)}
      </Row>

      {/* Context */}
      <SectionHeader label="Context" />
      <Row label="Window" mono>
        {m.context.window.toLocaleString()}
      </Row>
      <Row label="Max Output Tokens" mono>
        {m.context.maxOutput.toLocaleString()}
      </Row>
      <Row label="Knowledge Cutoff" mono>
        {m.context.cutoff}
      </Row>

      {/* Endpoints */}
      <SectionHeader label="Endpoints" />
      <Row label="v1/chat/completions">
        <Bool value={m.endpoints.chat} />
      </Row>
      <Row label="v1/responses">
        <Bool value={m.endpoints.responses} />
      </Row>
      <Row label="v1/batch">
        <Bool value={m.endpoints.batch} />
      </Row>

      {/* Features */}
      <SectionHeader label="Supported Features" />
      <Row label="Streaming">
        <Bool value={m.features.streaming} />
      </Row>
      <Row label="Function calling">
        <Bool value={m.features.functionCalling} />
      </Row>
      <Row label="Structured outputs">
        <Bool value={m.features.structuredOutputs} />
      </Row>
      <Row label="Image input">
        <Bool value={m.features.imageInput} />
      </Row>
    </div>
  )
}

// --- Page --------------------------------------------------------------------

export function CompareModels() {
  const [columns, setColumns] = React.useState<string[]>([
    "gpt-5.5",
    "gpt-5.5-pro",
    "gpt-5.4",
  ])

  function setColumn(i: number, id: string) {
    setColumns((c) => c.map((x, idx) => (idx === i ? id : x)))
  }
  function addColumn() {
    setColumns((c) => {
      if (c.length >= 4) return c
      const next = CATALOG.find((m) => !c.includes(m.id)) ?? CATALOG[0]
      return [...c, next.id]
    })
  }
  function removeColumn() {
    setColumns((c) => (c.length > 1 ? c.slice(0, -1) : c))
  }

  return (
    <div className="dark flex min-h-screen bg-background text-foreground">
      <AppSidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="mx-auto w-full max-w-6xl px-8 py-8">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Compare models</h1>
            <div className="flex items-center gap-3 text-text-muted">
              <button
                onClick={removeColumn}
                disabled={columns.length <= 1}
                className="flex size-7 items-center justify-center rounded-md transition-colors hover:bg-surface-2 hover:text-text disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                aria-label="Remove column"
              >
                <Minus size={16} />
              </button>
              <button
                onClick={addColumn}
                disabled={columns.length >= 4}
                className="flex size-7 items-center justify-center rounded-md transition-colors hover:bg-surface-2 hover:text-text disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                aria-label="Add column"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div
            className="mt-6 grid gap-8"
            style={{
              gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
            }}
          >
            {columns.map((id, i) => (
              <ModelColumn
                key={i}
                modelId={id}
                onChange={(next) => setColumn(i, next)}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
