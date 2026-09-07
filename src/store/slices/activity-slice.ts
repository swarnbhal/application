import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

import { fixtureActivity } from "@/data"
import type { ActivityEvent, ActivityEventType } from "@/types/mail"

interface ActivityState {
  events: ActivityEvent[]
  rangeFrom: string
  rangeTo: string
  timelinePage: number
  timelinePageSize: number
}

const initialState: ActivityState = {
  events: fixtureActivity,
  rangeFrom: "2026-08-01T00:00:00.000Z",
  rangeTo: "2026-09-04T23:59:59.000Z",
  timelinePage: 1,
  timelinePageSize: 5,
}

const activitySlice = createSlice({
  name: "activity",
  initialState,
  reducers: {
    appendEvent: {
      reducer: (state, action: PayloadAction<ActivityEvent>) => {
        state.events.unshift(action.payload)
      },
      prepare: (payload: {
        actorUserId: string
        type: ActivityEventType
        threadId?: string
        subject?: string
      }) => ({
        payload: {
          id: `a-${crypto.randomUUID().slice(0, 8)}`,
          actorUserId: payload.actorUserId,
          type: payload.type,
          threadId: payload.threadId,
          timestamp: new Date().toISOString(),
          meta: payload.subject ? { subject: payload.subject } : undefined,
        } satisfies ActivityEvent,
      }),
    },
    setActivityRange: (
      state,
      action: PayloadAction<{ from: string; to: string }>,
    ) => {
      state.rangeFrom = action.payload.from
      state.rangeTo = action.payload.to
      state.timelinePage = 1
    },
    setTimelinePage: (state, action: PayloadAction<number>) => {
      state.timelinePage = Math.max(1, action.payload)
    },
  },
})

export const { appendEvent, setActivityRange, setTimelinePage } =
  activitySlice.actions
export default activitySlice.reducer
