import { Button } from "@/components/ui/button"
import type { User } from "@/types/mail"

interface ReplyComposerProps {
  toUserIds: string[]
  usersById: Record<string, User>
  body: string
  onBodyChange: (value: string) => void
  onSend: () => void
  onDiscard: () => void
  canSend: boolean
}

export function ReplyComposer({
  toUserIds,
  usersById,
  body,
  onBodyChange,
  onSend,
  onDiscard,
  canSend,
}: ReplyComposerProps) {
  return (
    <section aria-label="Reply" className="border-t px-5 py-3">
      <p className="mb-2 flex flex-wrap items-center gap-1.5 text-sm">
        <span className="text-zinc-500">Reply to</span>
        {toUserIds.map((id) => (
          <span
            key={id}
            className="rounded-full border px-2 py-0.5 text-xs"
          >
            {usersById[id]?.name ?? id}
          </span>
        ))}
      </p>
      <label className="sr-only" htmlFor="reply-body">
        Reply body
      </label>
      <textarea
        id="reply-body"
        value={body}
        onChange={(event) => onBodyChange(event.target.value)}
        placeholder="Write a reply, or apply the draft above…"
        rows={4}
        className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <div className="mt-2 flex gap-2">
        <Button type="button" onClick={onSend} disabled={!canSend}>
          Send
        </Button>
        <Button type="button" variant="ghost" onClick={onDiscard}>
          Discard
        </Button>
      </div>
    </section>
  )
}
