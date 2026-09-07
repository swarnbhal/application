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
        "shrink-0 rounded-full px-2 py-0.5 text-[11px] tracking-wide transition-colors duration-200",
        urgency === "needs_reply" &&
          "bg-primary/12 font-medium text-primary",
        urgency === "waiting" && "bg-secondary text-secondary-foreground",
        urgency === "fyi" && "text-muted-foreground",
      )}
    >
      {labels[urgency]}
    </span>
  )
}
