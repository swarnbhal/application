import type { ActivityEvent, Message, Thread, User } from "@/types/mail"
import { lastMessageOf, urgencyFor } from "@/lib/mail"

export interface UserMetrics {
  userId: string
  sent: number
  received: number
  medianReplyMs: number | null
  unanswered: number
  aiApplyRate: number | null
  unansweredOlderThanDays: number
}

export interface OrgMetrics {
  sent: number
  received: number
  medianReplyMs: number | null
  unanswered: number
  unansweredOlderThanDays: number
  aiApplyRate: number | null
  perUser: UserMetrics[]
}

function inRange(iso: string, from: string | null, to: string | null): boolean {
  if (from && iso < from) return false
  if (to && iso > to) return false
  return true
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2)
  }
  return sorted[mid]
}

export function formatDuration(ms: number | null): string {
  if (ms === null) return "—"
  const minutes = Math.round(ms / 60_000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours < 24) return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h`
}

function replyTimesMs(
  userId: string,
  threads: Thread[],
  messages: Message[],
): number[] {
  const times: number[] = []
  for (const thread of threads) {
    if (!thread.participantIds.includes(userId)) continue
    const threadMessages = messages
      .filter((message) => message.threadId === thread.id)
      .sort((a, b) => a.sentAt.localeCompare(b.sentAt))
    for (let i = 1; i < threadMessages.length; i += 1) {
      const current = threadMessages[i]
      if (current.fromUserId !== userId) continue
      const previous = threadMessages[i - 1]
      if (previous.fromUserId === userId) continue
      times.push(
        new Date(current.sentAt).getTime() - new Date(previous.sentAt).getTime(),
      )
    }
  }
  return times
}

export function computeOrgMetrics(
  users: User[],
  threads: Thread[],
  messages: Message[],
  events: ActivityEvent[],
  from: string | null,
  to: string | null,
  nowIso: string,
): OrgMetrics {
  const rangedEvents = events.filter((event) =>
    inRange(event.timestamp, from, to),
  )
  const rangedMessages = messages.filter((message) =>
    inRange(message.sentAt, from, to),
  )

  const perUser = users.map((user) => {
    const sent = rangedMessages.filter(
      (message) => message.fromUserId === user.id,
    ).length
    const received = rangedMessages.filter(
      (message) =>
        message.toUserIds.includes(user.id) && message.fromUserId !== user.id,
    ).length
    const unanswered = threads.filter((thread) => {
      if (!thread.participantIds.includes(user.id)) return false
      const last = lastMessageOf(thread, messages)
      if (!last) return false
      return urgencyFor(user.id, last) === "needs_reply"
    }).length
    const unansweredOlderThanDays = threads.filter((thread) => {
      if (!thread.participantIds.includes(user.id)) return false
      const last = lastMessageOf(thread, messages)
      if (!last) return false
      if (urgencyFor(user.id, last) !== "needs_reply") return false
      const age =
        new Date(nowIso).getTime() - new Date(last.sentAt).getTime()
      return age > 5 * 86_400_000
    }).length
    const applied = rangedEvents.filter(
      (event) =>
        event.actorUserId === user.id && event.type === "ai_reply_applied",
    ).length
    const sentEvents = rangedEvents.filter(
      (event) => event.actorUserId === user.id && event.type === "email_sent",
    ).length
    const aiApplyRate =
      sentEvents + applied === 0 ? null : applied / Math.max(sentEvents, 1)

    return {
      userId: user.id,
      sent,
      received,
      medianReplyMs: median(replyTimesMs(user.id, threads, rangedMessages)),
      unanswered,
      unansweredOlderThanDays,
      aiApplyRate,
    }
  })

  const sent = perUser.reduce((sum, row) => sum + row.sent, 0)
  const received = perUser.reduce((sum, row) => sum + row.received, 0)
  const unanswered = perUser.reduce((sum, row) => sum + row.unanswered, 0)
  const unansweredOlderThanDays = perUser.reduce(
    (sum, row) => sum + row.unansweredOlderThanDays,
    0,
  )
  const allReply = perUser
    .map((row) => row.medianReplyMs)
    .filter((value): value is number => value !== null)

  const applied = rangedEvents.filter(
    (event) => event.type === "ai_reply_applied",
  ).length
  const sentEvents = rangedEvents.filter(
    (event) => event.type === "email_sent",
  ).length

  return {
    sent,
    received,
    medianReplyMs: median(allReply),
    unanswered,
    unansweredOlderThanDays,
    aiApplyRate:
      sentEvents + applied === 0 ? null : applied / Math.max(sentEvents, 1),
    perUser,
  }
}

export function orgNarrativePayload(metrics: OrgMetrics): string {
  const lines = metrics.perUser.map((row) =>
    [
      row.userId,
      `sent=${row.sent}`,
      `recv=${row.received}`,
      `unanswered=${row.unanswered}`,
      `older5d=${row.unansweredOlderThanDays}`,
      `medianReplyMs=${row.medianReplyMs ?? "null"}`,
      `aiApply=${row.aiApplyRate ?? "null"}`,
    ].join(" "),
  )
  return [
    `org sent=${metrics.sent} received=${metrics.received} unanswered=${metrics.unanswered} older5d=${metrics.unansweredOlderThanDays}`,
    ...lines,
  ].join("\n")
}
