import { QuietMarker } from "@/components/ai/QuietMarker"
import { Button } from "@/components/ui/button"

interface MessageSummaryProps {
  bullets: string[]
  pending: boolean
  onRetry: () => void
}

export function MessageSummary({
  bullets,
  pending,
  onRetry,
}: MessageSummaryProps) {
  return (
    <section
      aria-label="Message summary"
      className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 border-b border-border bg-primary/5 px-5 py-3"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          Summary · this message
        </p>
        {pending ? (
          <span className="text-xs text-muted-foreground">Writing…</span>
        ) : bullets.length === 0 ? (
          <Button type="button" size="xs" variant="ghost" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </div>
      {bullets.length === 0 && !pending ? (
        <p className="text-sm text-muted-foreground">No summary yet.</p>
      ) : (
        <ul className="space-y-1">
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
