import type {
  DatePreset,
  DateRange,
  Folder,
  Message,
  SmartView,
  Thread,
  Urgency,
  User,
} from "@/types/mail"

export const NOW = new Date("2026-09-04T12:00:00.000Z")

export interface MailQuery {
  userId: string
  folder: Folder
  keyword: string
  datePreset: DatePreset
  customRange: DateRange
  personId: string | null
  smartView: SmartView
  page: number
  pageSize: number
}

export interface ThreadPreview {
  thread: Thread
  lastMessage: Message
  otherParticipantIds: string[]
  urgency: Urgency
  unread: boolean
}

export interface PaginatedThreads {
  items: ThreadPreview[]
  total: number
  page: number
  pageSize: number
  fromIndex: number
  toIndex: number
}

export interface PersonGroup {
  userId: string
  items: ThreadPreview[]
}

function messagesForThread(
  threadId: string,
  messages: Message[],
): Message[] {
  return messages
    .filter((message) => message.threadId === threadId)
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt))
}

export function lastMessageOf(
  thread: Thread,
  messages: Message[],
): Message | undefined {
  const list = messagesForThread(thread.id, messages)
  return list[list.length - 1]
}

export function threadMessages(
  threadId: string,
  messages: Message[],
): Message[] {
  return messagesForThread(threadId, messages)
}

export function urgencyFor(
  userId: string,
  lastMessage: Message,
): Urgency {
  if (lastMessage.fromUserId === userId) return "waiting"
  if (lastMessage.toUserIds.includes(userId)) return "needs_reply"
  return "fyi"
}

export function inFolder(
  thread: Thread,
  messages: Message[],
  folder: Folder,
  userId: string,
): boolean {
  if (!thread.participantIds.includes(userId)) return false
  if (folder === "unread") return thread.unreadByUserIds.includes(userId)
  if (folder === "sent") {
    return messages.some(
      (message) =>
        message.threadId === thread.id && message.fromUserId === userId,
    )
  }
  return true
}

export function matchesSmartView(
  userId: string,
  lastMessage: Message,
  smartView: SmartView,
): boolean {
  if (smartView === "all") return true
  const urgency = urgencyFor(userId, lastMessage)
  if (smartView === "needs_reply") return urgency === "needs_reply"
  return urgency === "waiting"
}

export function dateRangeForPreset(
  preset: DatePreset,
  custom: DateRange,
  now: Date = NOW,
): DateRange {
  if (preset === "all") return { from: null, to: null }
  if (preset === "custom") return custom
  const end = now.toISOString()
  if (preset === "today") {
    const start = new Date(now)
    start.setUTCHours(0, 0, 0, 0)
    return { from: start.toISOString(), to: end }
  }
  const days = preset === "7d" ? 7 : 30
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  return { from: start.toISOString(), to: end }
}

function inDateRange(iso: string, range: DateRange): boolean {
  if (range.from && iso < range.from) return false
  if (range.to && iso > range.to) return false
  return true
}

function keywordHaystack(
  thread: Thread,
  messages: Message[],
  gist?: string,
): string {
  const bodies = messagesForThread(thread.id, messages)
    .map((message) => message.body)
    .join(" ")
  return `${thread.subject} ${bodies} ${gist ?? ""}`.toLowerCase()
}

export function otherParticipants(
  thread: Thread,
  lastMessage: Message,
  userId: string,
): string[] {
  const others = thread.participantIds.filter((id) => id !== userId)
  if (lastMessage.fromUserId !== userId) {
    return [
      lastMessage.fromUserId,
      ...others.filter((id) => id !== lastMessage.fromUserId),
    ]
  }
  return others
}

export function toPreview(
  thread: Thread,
  messages: Message[],
  userId: string,
): ThreadPreview | null {
  const lastMessage = lastMessageOf(thread, messages)
  if (!lastMessage) return null
  return {
    thread,
    lastMessage,
    otherParticipantIds: otherParticipants(thread, lastMessage, userId),
    urgency: urgencyFor(userId, lastMessage),
    unread: thread.unreadByUserIds.includes(userId),
  }
}

export function filterThreads(
  threads: Thread[],
  messages: Message[],
  query: MailQuery,
  gists: Record<string, string> = {},
  now: Date = NOW,
): ThreadPreview[] {
  const range = dateRangeForPreset(query.datePreset, query.customRange, now)
  const keyword = query.keyword.trim().toLowerCase()

  return threads
    .filter((thread) => inFolder(thread, messages, query.folder, query.userId))
    .map((thread) => toPreview(thread, messages, query.userId))
    .filter((preview): preview is ThreadPreview => preview !== null)
    .filter((preview) =>
      matchesSmartView(query.userId, preview.lastMessage, query.smartView),
    )
    .filter((preview) => inDateRange(preview.thread.lastMessageAt, range))
    .filter((preview) => {
      if (!keyword) return true
      return keywordHaystack(
        preview.thread,
        messages,
        gists[preview.thread.id],
      ).includes(keyword)
    })
    .filter((preview) => {
      if (!query.personId) return true
      return preview.otherParticipantIds.includes(query.personId)
    })
    .sort((a, b) =>
      b.thread.lastMessageAt.localeCompare(a.thread.lastMessageAt),
    )
}

export function paginateThreads(
  previews: ThreadPreview[],
  page: number,
  pageSize: number,
): PaginatedThreads {
  const total = previews.length
  const safePage = Math.max(1, page)
  const start = (safePage - 1) * pageSize
  const items = previews.slice(start, start + pageSize)
  const fromIndex = total === 0 ? 0 : start + 1
  const toIndex = start + items.length
  return { items, total, page: safePage, pageSize, fromIndex, toIndex }
}

export function smartViewCounts(
  threads: Thread[],
  messages: Message[],
  query: Omit<MailQuery, "smartView" | "page" | "pageSize">,
  gists: Record<string, string> = {},
  now: Date = NOW,
): { needsReply: number; waiting: number } {
  const base = { ...query, smartView: "all" as const, page: 1, pageSize: 9999 }
  const all = filterThreads(threads, messages, base, gists, now)
  return {
    needsReply: all.filter((item) => item.urgency === "needs_reply").length,
    waiting: all.filter((item) => item.urgency === "waiting").length,
  }
}

export function folderCounts(
  threads: Thread[],
  messages: Message[],
  userId: string,
): Record<Folder, number> {
  return {
    inbox: threads.filter((thread) =>
      inFolder(thread, messages, "inbox", userId),
    ).length,
    unread: threads.filter((thread) =>
      inFolder(thread, messages, "unread", userId),
    ).length,
    sent: threads.filter((thread) =>
      inFolder(thread, messages, "sent", userId),
    ).length,
  }
}

export function groupByPerson(
  previews: ThreadPreview[],
  users: User[],
): PersonGroup[] {
  const groups = new Map<string, ThreadPreview[]>()
  for (const preview of previews) {
    const key = preview.otherParticipantIds[0] ?? "unknown"
    const list = groups.get(key) ?? []
    list.push(preview)
    groups.set(key, list)
  }
  const known = users.map((user) => user.id)
  return [...groups.entries()]
    .sort((a, b) => known.indexOf(a[0]) - known.indexOf(b[0]))
    .map(([userId, items]) => ({ userId, items }))
}

export function filterHash(
  query: Omit<MailQuery, "page" | "pageSize"> & {
    page: number
    pageSize: number
    modelId: string
  },
): string {
  return [
    query.userId,
    query.folder,
    query.keyword.trim().toLowerCase(),
    query.datePreset,
    query.customRange.from ?? "",
    query.customRange.to ?? "",
    query.personId ?? "",
    query.smartView,
    String(query.page),
    String(query.pageSize),
    query.modelId,
  ].join("|")
}

export function isComposeValid(
  toUserIds: string[],
  subject: string,
  body: string,
): boolean {
  return toUserIds.length > 0 && subject.trim() !== "" && body.trim() !== ""
}

export function formatRelativeTime(
  iso: string,
  now: Date = NOW,
): string {
  const date = new Date(iso)
  const sameDay =
    date.getUTCFullYear() === now.getUTCFullYear() &&
    date.getUTCMonth() === now.getUTCMonth() &&
    date.getUTCDate() === now.getUTCDate()
  if (sameDay) {
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    })
  }
  const diffDays = Math.floor(
    (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) -
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())) /
      86_400_000,
  )
  if (diffDays < 7) {
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      timeZone: "UTC",
    })
  }
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })
}

export function formatAbsolute(
  iso: string,
): string {
  const date = new Date(iso)
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  })
}

export function participantLabel(
  ids: string[],
  usersById: Record<string, User>,
  currentUserId: string,
): string {
  const others = ids.filter((id) => id !== currentUserId)
  if (others.length === 0) return usersById[currentUserId]?.name ?? "You"
  const first = usersById[others[0]]?.name ?? others[0]
  if (others.length === 1) return first
  return `${first}, +${others.length - 1}`
}
