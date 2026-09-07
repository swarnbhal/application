import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

import { fixtureMessages, fixtureThreads } from "@/data"
import { isComposeValid } from "@/lib/mail"
import type { Message, Thread } from "@/types/mail"

interface MailState {
  threads: Thread[]
  messages: Message[]
}

const initialState: MailState = {
  threads: fixtureThreads,
  messages: fixtureMessages,
}

function nextId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

const mailSlice = createSlice({
  name: "mail",
  initialState,
  reducers: {
    markThreadOpened: (
      state,
      action: PayloadAction<{ threadId: string; userId: string }>,
    ) => {
      const thread = state.threads.find(
        (item) => item.id === action.payload.threadId,
      )
      if (!thread) return
      if (!thread.unreadByUserIds.includes(action.payload.userId)) return
      thread.unreadByUserIds = thread.unreadByUserIds.filter(
        (id) => id !== action.payload.userId,
      )
    },
    replyToThread: {
      reducer: (
        state,
        action: PayloadAction<{
          threadId: string
          fromUserId: string
          toUserIds: string[]
          body: string
          sentAt: string
          messageId: string
        }>,
      ) => {
        const { threadId, fromUserId, toUserIds, body, sentAt, messageId } =
          action.payload
        if (!body.trim() || toUserIds.length === 0) return
        const thread = state.threads.find((item) => item.id === threadId)
        if (!thread) return
        state.messages.push({
          id: messageId,
          threadId,
          fromUserId,
          toUserIds,
          body: body.trim(),
          sentAt,
        })
        thread.lastMessageAt = sentAt
        const unread = new Set(
          thread.participantIds.filter((id) => id !== fromUserId),
        )
        thread.unreadByUserIds = [...unread]
      },
      prepare: (payload: {
        threadId: string
        fromUserId: string
        toUserIds: string[]
        body: string
      }) => ({
        payload: {
          ...payload,
          sentAt: new Date().toISOString(),
          messageId: nextId("m"),
        },
      }),
    },
    createThread: {
      reducer: (
        state,
        action: PayloadAction<{
          threadId: string
          messageId: string
          fromUserId: string
          toUserIds: string[]
          subject: string
          body: string
          sentAt: string
        }>,
      ) => {
        const {
          threadId,
          messageId,
          fromUserId,
          toUserIds,
          subject,
          body,
          sentAt,
        } = action.payload
        if (!isComposeValid(toUserIds, subject, body)) return
        const participantIds = [...new Set([fromUserId, ...toUserIds])]
        state.threads.unshift({
          id: threadId,
          subject: subject.trim(),
          participantIds,
          lastMessageAt: sentAt,
          unreadByUserIds: toUserIds,
        })
        state.messages.push({
          id: messageId,
          threadId,
          fromUserId,
          toUserIds,
          body: body.trim(),
          sentAt,
        })
      },
      prepare: (payload: {
        fromUserId: string
        toUserIds: string[]
        subject: string
        body: string
      }) => {
        const sentAt = new Date().toISOString()
        return {
          payload: {
            ...payload,
            sentAt,
            threadId: nextId("t"),
            messageId: nextId("m"),
          },
        }
      },
    },
  },
})

export const { markThreadOpened, replyToThread, createThread } = mailSlice.actions
export default mailSlice.reducer
