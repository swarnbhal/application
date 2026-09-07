import { QuietMarker } from "@/components/ai/QuietMarker"
import { UrgencyChip } from "@/components/mail/UrgencyChip"
import { cn } from "@/lib/utils"
import { formatRelativeTime, participantLabel } from "@/lib/mail"
import type { ThreadPreview } from "@/lib/mail"
import type { User } from "@/types/mail"

interface ThreadRowProps {
  preview: ThreadPreview
  gist?: string
  gistPending?: boolean
  selected: boolean
  id: string
  usersById: Record<string, User>
  currentUserId: string
  onSelect: () => void
}

export function ThreadRow({
  preview,
  gist,
  gistPending,
  selected,
  id,
  usersById,
  currentUserId,
  onSelect,
}: ThreadRowProps) {
  const { thread, unread, urgency } = preview
  const who = participantLabel(
    preview.otherParticipantIds,
    usersById,
    currentUserId,
  )

  return (
    <div
      id={id}
      role="option"
      aria-selected={selected}
      tabIndex={-1}
      className={cn(
        "flex cursor-pointer items-center gap-4 border-b border-border px-4 outline-none transition-colors duration-200",
        "hover:bg-accent/70 focus-visible:ring-3 focus-visible:ring-ring/50",
        unread ? "h-[68px]" : "h-[62px]",
        selected && "bg-primary/10 shadow-[inset_3px_0_0_0_var(--primary)]",
        unread && !selected && "border-l-2 border-l-primary/45",
      )}
      onClick={onSelect}
    >
      <p
        className={cn(
          "w-40 shrink-0 truncate text-sm",
          unread ? "font-medium text-foreground" : "text-muted-foreground",
        )}
      >
        {who}
      </p>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm",
            unread ? "font-medium" : "text-foreground",
          )}
        >
          {thread.subject}
        </p>
        {gist ? (
          <p className="flex min-w-0 items-start gap-2 text-sm text-muted-foreground">
            <QuietMarker />
            <span className="truncate">{gist}</span>
          </p>
        ) : gistPending ? (
          <p className="truncate text-sm text-muted-foreground/80">Writing gist…</p>
        ) : null}
      </div>
      <UrgencyChip urgency={urgency} />
      <time
        className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground"
        dateTime={thread.lastMessageAt}
      >
        {formatRelativeTime(thread.lastMessageAt)}
      </time>
    </div>
  )
}
