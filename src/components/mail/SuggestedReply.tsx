import { QuietMarker } from "@/components/ai/QuietMarker"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ReplyTone } from "@/types/mail"

interface SuggestedReplyProps {
  draft: string
  pending: boolean
  tone: ReplyTone
  onTone: (tone: ReplyTone) => void
  onApply: () => void
  onRegenerate: () => void
  onCopy: () => void
  onDismiss: () => void
}

const TONES: ReplyTone[] = ["brief", "friendly", "formal"]

export function SuggestedReply({
  draft,
  pending,
  tone,
  onTone,
  onApply,
  onRegenerate,
  onCopy,
  onDismiss,
}: SuggestedReplyProps) {
  return (
    <section aria-label="Suggested reply" className="border-t border-border bg-card px-5 py-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          Suggested reply · draft 1
        </p>
        <div className="flex items-center gap-1" role="group" aria-label="Tone">
          <span className="mr-1 text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            Tone
          </span>
          {TONES.map((item) => (
            <Button
              key={item}
              type="button"
              size="xs"
              variant={tone === item ? "secondary" : "ghost"}
              aria-pressed={tone === item}
              className={cn("capitalize")}
              onClick={() => onTone(item)}
            >
              {item}
            </Button>
          ))}
        </div>
      </div>
      {pending ? (
        <p className="text-sm text-muted-foreground">Writing a draft…</p>
      ) : draft ? (
        <p className="flex items-start gap-2 whitespace-pre-wrap text-sm text-foreground">
          <QuietMarker className="mt-1.5" />
          <span>{draft}</span>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">No draft yet.</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={onRegenerate}>
          Regenerate
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCopy} disabled={!draft}>
          Copy
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDismiss}>
          Dismiss
        </Button>
        <Button type="button" size="sm" onClick={onApply} disabled={!draft}>
          Apply to reply
        </Button>
        <p className="text-[11px] text-muted-foreground">
          Apply fills the composer. Nothing sends without you.
        </p>
      </div>
    </section>
  )
}
