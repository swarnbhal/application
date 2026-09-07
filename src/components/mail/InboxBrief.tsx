import { QuietMarker } from "@/components/ai/QuietMarker"
import { Button } from "@/components/ui/button"
import { formatRelativeTime } from "@/lib/mail"

interface InboxBriefProps {
  bullets: string[]
  pending: boolean
  unavailable: boolean
  generatedAt?: string
  model?: string
  threadCount: number
  emptySet: boolean
  onRetry: () => void
}

export function InboxBrief({
  bullets,
  pending,
  unavailable,
  generatedAt,
  model,
  threadCount,
  emptySet,
  onRetry,
}: InboxBriefProps) {
  if (emptySet) return null

  if (unavailable && bullets.length === 0) {
    return (
      <section
        aria-label="Inbox brief unavailable"
        className="border-b px-4 py-3"
      >
        <p className="text-sm font-medium">Insights are off — Ollama is not reachable</p>
        <p className="mt-1 text-sm text-zinc-500">
          Mail, search, filters and compose all still work. Gists and briefs will
          fill in when it comes back.
        </p>
        <Button type="button" size="sm" variant="outline" className="mt-2" onClick={onRetry}>
          Retry
        </Button>
      </section>
    )
  }

  return (
    <section aria-label="What needs you now" className="border-b px-4 py-3">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium">What needs you now</h2>
        <p className="text-[11px] tracking-[0.14em] text-zinc-400 uppercase">
          {pending
            ? "Writing a brief…"
            : generatedAt
              ? `Written ${formatRelativeTime(generatedAt)} · ${model ?? ""} · ${threadCount} threads read`
              : `${threadCount} threads`}
        </p>
      </div>
      {pending && bullets.length === 0 ? (
        <p className="text-sm text-zinc-400">Writing a brief… reading {threadCount} threads</p>
      ) : (
        <ul className="space-y-1.5">
          {bullets.map((line) => (
            <li key={line} className="flex items-start gap-2 text-sm text-zinc-700">
              <QuietMarker className="mt-1.5" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
