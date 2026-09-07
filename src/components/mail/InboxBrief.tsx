import { QuietMarker } from "@/components/ai/QuietMarker"
import { Button } from "@/components/ui/button"
import { formatRelativeTime } from "@/lib/mail"

interface InboxBriefProps {
  bullets: string[]
  pending: boolean
  unavailable: boolean
  generatedAt?: string
  threadCount: number
  emptySet: boolean
  onRetry: () => void
  onRefresh: () => void
}

export function InboxBrief({
  bullets,
  pending,
  unavailable,
  generatedAt,
  threadCount,
  emptySet,
  onRetry,
  onRefresh,
}: InboxBriefProps) {
  if (emptySet) return null

  if (unavailable && bullets.length === 0) {
    return (
      <section
        aria-label="Inbox brief unavailable"
        className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 border-b border-border bg-card/80 px-4 py-3"
      >
        <p className="text-sm font-medium">Insights are off — Ollama is not reachable</p>
        <p className="mt-1 text-sm text-muted-foreground">
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
    <section
      aria-label="What needs you now"
      className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 border-b border-border bg-primary/5 px-4 py-3"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium">What needs you now</h2>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            {pending
              ? "Refreshing insights…"
              : generatedAt
                ? `Written ${formatRelativeTime(generatedAt)} · ${threadCount} threads read`
                : `${threadCount} threads`}
          </p>
          <Button
            type="button"
            size="xs"
            variant="outline"
            aria-label="Refresh insights"
            disabled={pending}
            onClick={onRefresh}
          >
            {pending ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>
      {pending && bullets.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Writing a brief… reading {threadCount} threads
        </p>
      ) : (
        <ul className="space-y-1.5">
          {bullets.map((line) => (
            <li key={line} className="flex items-start gap-2 text-sm text-foreground/85">
              <QuietMarker className="mt-1.5" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
