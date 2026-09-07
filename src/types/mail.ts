export type UserRole = "admin" | "member"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface Thread {
  id: string
  subject: string
  participantIds: string[]
  lastMessageAt: string
  unreadByUserIds: string[]
}

export interface Message {
  id: string
  threadId: string
  fromUserId: string
  toUserIds: string[]
  body: string
  sentAt: string
}

export type ActivityEventType =
  | "email_sent"
  | "email_opened"
  | "thread_created"
  | "ai_reply_applied"

export interface ActivityEvent {
  id: string
  actorUserId: string
  type: ActivityEventType
  threadId?: string
  timestamp: string
  meta?: {
    subject?: string
  }
}

export type AiInsightKind =
  | "gist"
  | "summary"
  | "reply"
  | "inbox_brief"
  | "org_narrative"

export type AiTargetType = "thread" | "message" | "inbox" | "org"

export interface AiInsight {
  targetType: AiTargetType
  targetId: string
  kind: AiInsightKind
  content: string
  model: string
  generatedAt: string
}

export type Folder = "inbox" | "unread" | "sent"

export type SmartView = "all" | "needs_reply" | "waiting"

export type DatePreset = "all" | "today" | "7d" | "30d" | "custom"

export type Urgency = "needs_reply" | "waiting" | "fyi"

export type ReplyTone = "brief" | "friendly" | "formal"

export interface LlmModel {
  id: string
  label: string
  ollamaName: string
}

export interface DateRange {
  from: string | null
  to: string | null
}
