import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface ComposeState {
  toUserIds: string[]
  subject: string
  body: string
  intent: string
  replyBody: string
  replyToUserIds: string[]
  appliedAi: boolean
  selectedMessageId: string | null
}

const initialState: ComposeState = {
  toUserIds: [],
  subject: "",
  body: "",
  intent: "",
  replyBody: "",
  replyToUserIds: [],
  appliedAi: false,
  selectedMessageId: null,
}

const composeSlice = createSlice({
  name: "compose",
  initialState,
  reducers: {
    setComposeTo: (state, action: PayloadAction<string[]>) => {
      state.toUserIds = action.payload
    },
    setComposeSubject: (state, action: PayloadAction<string>) => {
      state.subject = action.payload
    },
    setComposeBody: (state, action: PayloadAction<string>) => {
      state.body = action.payload
    },
    setComposeIntent: (state, action: PayloadAction<string>) => {
      state.intent = action.payload
    },
    setReplyBody: (state, action: PayloadAction<string>) => {
      state.replyBody = action.payload
    },
    setReplyToUserIds: (state, action: PayloadAction<string[]>) => {
      state.replyToUserIds = action.payload
    },
    applySuggestedReply: (state, action: PayloadAction<string>) => {
      state.replyBody = action.payload
      state.appliedAi = true
    },
    setSelectedMessageId: (state, action: PayloadAction<string | null>) => {
      if (state.selectedMessageId === action.payload) return
      state.selectedMessageId = action.payload
      state.replyBody = ""
      state.appliedAi = false
    },
    resetCompose: () => initialState,
    resetReply: (state) => {
      state.replyBody = ""
      state.appliedAi = false
    },
  },
})

export const {
  setComposeTo,
  setComposeSubject,
  setComposeBody,
  setComposeIntent,
  applySuggestedReply,
  setReplyBody,
  setReplyToUserIds,
  setSelectedMessageId,
  resetCompose,
  resetReply,
} = composeSlice.actions
export default composeSlice.reducer
