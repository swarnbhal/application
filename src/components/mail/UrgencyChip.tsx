import { cn } from "@/lib/utils"
import type { Urgency } from "@/types/mail"

const labels: Record<Urgency, string> = {
  needs_reply: "needs reply",
  waiting: "waiting",
  fyi: "fyi",
}

export function UrgencyChip({ urgency }: { urgency: Urgency }) {
  return (
    <span
      className={cn(
        "shrink-0 text-[11px] tracking-wide text-zinc-500",
        urgency === "needs_reply" && "text-zinc-700",
      )}
    >
      {labels[urgency]}
    </span>
  )
}
