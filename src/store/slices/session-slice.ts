import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

import { DEFAULT_MODEL_ID } from "@/config/models"
import { DEFAULT_USER_ID } from "@/data/users"

export type OllamaStatus = "unknown" | "ready" | "unavailable"

interface SessionState {
  currentUserId: string
  selectedModelId: string
  ollamaStatus: OllamaStatus
}

const initialState: SessionState = {
  currentUserId: DEFAULT_USER_ID,
  selectedModelId: DEFAULT_MODEL_ID,
  ollamaStatus: "unknown",
}

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setCurrentUserId: (state, action: PayloadAction<string>) => {
      state.currentUserId = action.payload
    },
    setSelectedModelId: (state, action: PayloadAction<string>) => {
      state.selectedModelId = action.payload
    },
    setOllamaStatus: (state, action: PayloadAction<OllamaStatus>) => {
      state.ollamaStatus = action.payload
    },
  },
})

export const { setCurrentUserId, setSelectedModelId, setOllamaStatus } =
  sessionSlice.actions
export default sessionSlice.reducer
