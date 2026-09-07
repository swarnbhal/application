import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { fixtureUsers } from "@/data"
import { isComposeValid } from "@/lib/mail"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { selectCurrentUser } from "@/store/selectors"
import { appendEvent } from "@/store/slices/activity-slice"
import { generateComposeDraft } from "@/store/slices/ai-slice"
import {
  resetCompose,
  setComposeBody,
  setComposeIntent,
  setComposeSubject,
  setComposeTo,
} from "@/store/slices/compose-slice"
import { createThread } from "@/store/slices/mail-slice"

export default function ComposePage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector(selectCurrentUser)
  const draft = useAppSelector((state) => state.compose)
  const ollamaStatus = useAppSelector((state) => state.session.ollamaStatus)
  const [error, setError] = useState<string | null>(null)
  const [intentPending, setIntentPending] = useState(false)
  const others = fixtureUsers.filter((item) => item.id !== user.id)
  const dirty =
    draft.toUserIds.length > 0 ||
    draft.subject.trim() !== "" ||
    draft.body.trim() !== ""

  function toggleRecipient(id: string) {
    const next = draft.toUserIds.includes(id)
      ? draft.toUserIds.filter((item) => item !== id)
      : [...draft.toUserIds, id]
    dispatch(setComposeTo(next))
  }

  function send() {
    if (!isComposeValid(draft.toUserIds, draft.subject, draft.body)) {
      setError("Add at least one recipient, a subject, and a body.")
      return
    }
    const action = dispatch(
      createThread({
        fromUserId: user.id,
        toUserIds: draft.toUserIds,
        subject: draft.subject,
        body: draft.body,
      }),
    )
    const threadId = action.payload.threadId
    dispatch(
      appendEvent({
        actorUserId: user.id,
        type: "thread_created",
        threadId,
        subject: draft.subject,
      }),
    )
    dispatch(
      appendEvent({
        actorUserId: user.id,
        type: "email_sent",
        threadId,
        subject: draft.subject,
      }),
    )
    dispatch(resetCompose())
    navigate(`/sent/${threadId}`)
  }

  async function fromIntent() {
    if (!draft.intent.trim() || ollamaStatus !== "ready") return
    setIntentPending(true)
    try {
      const text = await dispatch(
        generateComposeDraft({ intent: draft.intent }),
      ).unwrap()
      const [subjectLine, ...rest] = text.split("\n")
      dispatch(setComposeSubject(subjectLine.replace(/^Subject:\s*/i, "").trim()))
      dispatch(setComposeBody(rest.join("\n").trim()))
    } catch {
      setError("Could not draft from intent. Mail still works — write it yourself.")
    } finally {
      setIntentPending(false)
    }
  }

  function discard() {
    if (dirty && !window.confirm("Discard this draft?")) return
    dispatch(resetCompose())
    navigate("/inbox")
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-auto px-8 py-6">
      <h1 className="text-lg font-medium tracking-tight">New thread</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Write it yourself, or describe the intent and we will draft subject and body.
      </p>
      <form
        className="mt-6 max-w-2xl space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          send()
        }}
      >
        <fieldset>
          <legend className="mb-2 text-sm font-medium">To</legend>
          <div className="flex flex-wrap gap-2">
            {others.map((item) => {
              const selected = draft.toUserIds.includes(item.id)
              return (
                <label
                  key={item.id}
                  className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleRecipient(item.id)}
                  />
                  {item.name}
                </label>
              )
            })}
          </div>
        </fieldset>
        <div>
          <label htmlFor="compose-intent" className="text-sm font-medium">
            Intent (optional)
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="compose-intent"
              value={draft.intent}
              onChange={(event) => dispatch(setComposeIntent(event.target.value))}
              placeholder="Ask Priya for the Q3 numbers by Friday"
              className="h-8 flex-1 rounded-lg border border-border px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <Button
              type="button"
              variant="outline"
              disabled={ollamaStatus !== "ready" || intentPending}
              onClick={() => void fromIntent()}
            >
              {intentPending ? "Drafting…" : "Draft"}
            </Button>
          </div>
        </div>
        <div>
          <label htmlFor="compose-subject" className="text-sm font-medium">
            Subject
          </label>
          <input
            id="compose-subject"
            value={draft.subject}
            onChange={(event) => dispatch(setComposeSubject(event.target.value))}
            className="mt-1 h-8 w-full rounded-lg border border-border px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <div>
          <label htmlFor="compose-body" className="text-sm font-medium">
            Body
          </label>
          <textarea
            id="compose-body"
            value={draft.body}
            onChange={(event) => dispatch(setComposeBody(event.target.value))}
            rows={10}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex gap-2">
          <Button type="submit">Send</Button>
          <Button type="button" variant="ghost" onClick={discard}>
            Discard
          </Button>
        </div>
      </form>
    </main>
  )
}
