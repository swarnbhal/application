import { formatRelativeTime } from "@/lib/mail"
import { cn } from "@/lib/utils"
import type { Message, User } from "@/types/mail"

interface ThreadRailProps {
  messages: Message[]
  selectedId: string
  usersById: Record<string, User>
  onSelect: (messageId: string) => void
}

export function ThreadRail({
  messages,
  selectedId,
  usersById,
  onSelect,
}: ThreadRailProps) {
  return (
    <nav
      aria-label="Messages in thread"
      className="flex w-52 shrink-0 flex-col border-r border-border bg-muted/40"
    >
      <p className="px-3 py-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
        Thread rail
      </p>
      <ul className="min-h-0 flex-1 overflow-auto">
        {messages.map((message) => {
          const selected = message.id === selectedId
          return (
            <li key={message.id}>
              <button
                type="button"
                onClick={() => onSelect(message.id)}
                aria-current={selected ? "true" : undefined}
                className={cn(
                  "flex w-full flex-col items-start px-3 py-2.5 text-left outline-none transition-colors duration-200 focus-visible:ring-3 focus-visible:ring-ring/50",
                  selected
                    ? "bg-primary/10 shadow-[inset_2px_0_0_0_var(--primary)]"
                    : "hover:bg-accent/80",
                )}
              >
                <span className="flex w-full items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {usersById[message.fromUserId]?.name ?? "Unknown"}
                  </span>
                  <time className="shrink-0 text-[11px] text-muted-foreground">
                    {formatRelativeTime(message.sentAt)}
                  </time>
                </span>
                <span className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {message.body}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="px-3 py-2 text-[11px] text-muted-foreground">
        ↑ ↓ / j k to move · Enter to open
      </p>
    </nav>
  )
}
