import { useCallback, useEffect, useState, type KeyboardEvent } from "react"

import { ThreadRow } from "@/components/mail/ThreadRow"
import type { ThreadPreview } from "@/lib/mail"
import type { User } from "@/types/mail"

interface ThreadListProps {
  items: ThreadPreview[]
  selectedId?: string
  gists: Record<string, string>
  pending: Record<string, boolean>
  usersById: Record<string, User>
  currentUserId: string
  grouped?: { userId: string; items: ThreadPreview[] }[]
  onOpen: (threadId: string) => void
}

export function ThreadList({
  items,
  selectedId,
  gists,
  pending,
  usersById,
  currentUserId,
  grouped,
  onOpen,
}: ThreadListProps) {
  const ids = (grouped ? grouped.flatMap((group) => group.items) : items).map(
    (item) => item.thread.id,
  )
  const [activeId, setActiveId] = useState(selectedId ?? ids[0])

  useEffect(() => {
    if (selectedId) setActiveId(selectedId)
  }, [selectedId])

  const move = useCallback(
    (delta: number) => {
      const index = Math.max(0, ids.indexOf(activeId ?? ""))
      const next = ids[Math.min(ids.length - 1, Math.max(0, index + delta))]
      if (next) setActiveId(next)
    },
    [activeId, ids],
  )

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowDown" || event.key === "j") {
      event.preventDefault()
      move(1)
    } else if (event.key === "ArrowUp" || event.key === "k") {
      event.preventDefault()
      move(-1)
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      if (activeId) onOpen(activeId)
    }
  }

  function renderRow(preview: ThreadPreview) {
    return (
      <ThreadRow
        key={preview.thread.id}
        id={`thread-${preview.thread.id}`}
        preview={preview}
        gist={gists[preview.thread.id]}
        gistPending={pending[`gist:${preview.thread.id}`]}
        selected={preview.thread.id === selectedId}
        usersById={usersById}
        currentUserId={currentUserId}
        onSelect={() => onOpen(preview.thread.id)}
      />
    )
  }

  return (
    <div
      role="listbox"
      aria-label="Threads"
      aria-activedescendant={activeId ? `thread-${activeId}` : undefined}
      tabIndex={0}
      className="min-h-0 flex-1 overflow-auto outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50"
      onKeyDown={onKeyDown}
    >
      {grouped
        ? grouped.map((group) => (
            <section key={group.userId} className="border-b last:border-b-0">
              <h3 className="bg-muted/80 px-4 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground">
                {usersById[group.userId]?.name ?? "Other"}
              </h3>
              {group.items.map(renderRow)}
            </section>
          ))
        : items.map(renderRow)}
    </div>
  )
}
