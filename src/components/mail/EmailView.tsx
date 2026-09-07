import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"

import { MessageSummary } from "@/components/mail/MessageSummary"
import { ReplyComposer } from "@/components/mail/ReplyComposer"
import { SuggestedReply } from "@/components/mail/SuggestedReply"
import { ThreadRail } from "@/components/mail/ThreadRail"
import { UrgencyChip } from "@/components/mail/UrgencyChip"
import { formatAbsolute } from "@/lib/mail"
import { threadMessages, urgencyFor } from "@/lib/mail"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { selectInsight } from "@/store/selectors"
import { appendEvent } from "@/store/slices/activity-slice"
import {
  generateReply,
  generateSummary,
} from "@/store/slices/ai-slice"
import {
  applySuggestedReply,
  resetReply,
  setReplyBody,
  setReplyToUserIds,
  setSelectedMessageId,
} from "@/store/slices/compose-slice"
import { markThreadOpened, replyToThread } from "@/store/slices/mail-slice"
import type { ReplyTone } from "@/types/mail"
import { fixtureUsers } from "@/data"

interface EmailViewProps {
  threadId: string
  folderPath: string
  positionLabel: string
}

export function EmailView({
  threadId,
  folderPath,
  positionLabel,
}: EmailViewProps) {
  const dispatch = useAppDispatch()
  const thread = useAppSelector((state) =>
    state.mail.threads.find((item) => item.id === threadId),
  )
  const allMessages = useAppSelector((state) => state.mail.messages)
  const userId = useAppSelector((state) => state.session.currentUserId)
  const modelId = useAppSelector((state) => state.session.selectedModelId)
  const selectedMessageId = useAppSelector(
    (state) => state.compose.selectedMessageId,
  )
  const replyBody = useAppSelector((state) => state.compose.replyBody)
  const appliedAi = useAppSelector((state) => state.compose.appliedAi)
  const pending = useAppSelector((state) => state.ai.pending)
  const ollamaStatus = useAppSelector((state) => state.session.ollamaStatus)
  const [tone, setTone] = useState<ReplyTone>("brief")
  const [dismissed, setDismissed] = useState(false)
  const usersById = Object.fromEntries(fixtureUsers.map((user) => [user.id, user]))

  const messages = useMemo(
    () => (thread ? threadMessages(thread.id, allMessages) : []),
    [thread, allMessages],
  )
  const activeId = selectedMessageId ?? messages.at(-1)?.id
  const active = messages.find((message) => message.id === activeId)
  const summary = useAppSelector((state) =>
    active ? selectInsight(state, "summary", active.id) : undefined,
  )
  const reply = useAppSelector((state) =>
    active ? selectInsight(state, "reply", active.id) : undefined,
  )

  const openedFor = useRef<string | null>(null)

  useEffect(() => {
    if (!thread || openedFor.current === thread.id) return
    openedFor.current = thread.id
    if (thread.unreadByUserIds.includes(userId)) {
      dispatch(markThreadOpened({ threadId: thread.id, userId }))
    }
    dispatch(
      appendEvent({
        actorUserId: userId,
        type: "email_opened",
        threadId: thread.id,
        subject: thread.subject,
      }),
    )
  }, [dispatch, thread, userId])

  useEffect(() => {
    if (!active) return
    if (selectedMessageId === active.id) return
    dispatch(setSelectedMessageId(active.id))
    dispatch(
      setReplyToUserIds(
        [...new Set([active.fromUserId, ...active.toUserIds])].filter(
          (id) => id !== userId,
        ),
      ),
    )
  }, [active, dispatch, selectedMessageId, userId])

  const replyToUserIds = useAppSelector((state) => state.compose.replyToUserIds)

  if (!thread || !active) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-zinc-500">
        Thread not found.
      </div>
    )
  }

  const viewThread = thread
  const viewMessage = active
  const bullets = summary?.content.split("\n").filter(Boolean) ?? []
  const urgency = urgencyFor(userId, viewMessage)

  function requestSummary() {
    void dispatch(
      generateSummary({ messageId: viewMessage.id, body: viewMessage.body }),
    )
  }

  function requestReply(nextTone: ReplyTone) {
    const threadText = messages
      .map(
        (message) =>
          `${usersById[message.fromUserId]?.name}: ${message.body}`,
      )
      .join("\n\n")
    void dispatch(
      generateReply({
        messageId: viewMessage.id,
        threadText,
        tone: nextTone,
      }),
    )
  }

  function send() {
    dispatch(
      replyToThread({
        threadId: viewThread.id,
        fromUserId: userId,
        toUserIds: replyToUserIds,
        body: replyBody,
      }),
    )
    dispatch(
      appendEvent({
        actorUserId: userId,
        type: "email_sent",
        threadId: viewThread.id,
        subject: viewThread.subject,
      }),
    )
    if (appliedAi) {
      dispatch(
        appendEvent({
          actorUserId: userId,
          type: "ai_reply_applied",
          threadId: viewThread.id,
          subject: viewThread.subject,
        }),
      )
    }
    dispatch(resetReply())
  }

  return (
    <article className="flex min-h-0 min-w-0 flex-1 flex-col border-l">
      <header className="flex items-center justify-between gap-3 border-b px-4 py-2 text-sm">
        <div className="flex items-center gap-3">
          <Link
            to={folderPath}
            className="text-zinc-600 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            ← Inbox
          </Link>
          <p className="text-zinc-400">{positionLabel}</p>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <ThreadRail
          messages={messages}
          selectedId={active.id}
          usersById={usersById}
          onSelect={(id) => dispatch(setSelectedMessageId(id))}
        />
        <div className="flex min-w-0 flex-1 flex-col overflow-auto">
          <div className="px-5 py-4">
            <h1 className="text-lg font-medium tracking-tight">{thread.subject}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
              <span>
                {usersById[active.fromUserId]?.name}{" "}
                <span className="text-zinc-400">
                  &lt;{usersById[active.fromUserId]?.email}&gt;
                </span>
              </span>
              <span>
                to{" "}
                {active.toUserIds
                  .map((id) => usersById[id]?.name)
                  .filter(Boolean)
                  .join(", ")}
              </span>
              <time dateTime={active.sentAt}>{formatAbsolute(active.sentAt)}</time>
              <UrgencyChip urgency={urgency} />
            </p>
          </div>
          <MessageSummary
            bullets={bullets}
            pending={Boolean(pending[`summary:${active.id}`])}
            onRetry={requestSummary}
          />
          <div className="px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap text-zinc-800">
            {active.body}
          </div>
          {!dismissed ? (
            <SuggestedReply
              draft={reply?.content ?? ""}
              pending={Boolean(pending[`reply:${active.id}`])}
              model={modelId}
              tone={tone}
              onTone={(next) => {
                setTone(next)
                if (ollamaStatus === "ready") requestReply(next)
              }}
              onApply={() => {
                if (reply?.content) dispatch(applySuggestedReply(reply.content))
              }}
              onRegenerate={() => requestReply(tone)}
              onCopy={() => {
                if (reply?.content) void navigator.clipboard.writeText(reply.content)
              }}
              onDismiss={() => setDismissed(true)}
            />
          ) : null}
          <ReplyComposer
            toUserIds={replyToUserIds}
            usersById={usersById}
            body={replyBody}
            onBodyChange={(value) => dispatch(setReplyBody(value))}
            onSend={send}
            onDiscard={() => dispatch(resetReply())}
            canSend={replyBody.trim().length > 0 && replyToUserIds.length > 0}
          />
        </div>
      </div>
    </article>
  )
}
