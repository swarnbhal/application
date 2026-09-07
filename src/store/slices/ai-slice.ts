import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit"

import { getModelById } from "@/config/models"
import { fixtureInsights } from "@/data"
import { users } from "@/data/users"
import { ollamaAdapter } from "@/services/llm/ollamaAdapter"
import { prompts } from "@/services/llm/prompts"
import { insightKey } from "@/services/llm/types"
import { setOllamaStatus } from "@/store/slices/session-slice"
import type { AiInsight, AiInsightKind, ReplyTone } from "@/types/mail"

function userName(userId: string): string {
  return users.find((user) => user.id === userId)?.name ?? "the user"
}

function indexInsights(list: AiInsight[]): Record<string, AiInsight> {
  const map: Record<string, AiInsight> = {}
  for (const insight of list) {
    map[insightKey(insight.kind, insight.targetId, insight.model)] = insight
  }
  return map
}

interface SessionSlice {
  selectedModelId: string
  currentUserId: string
}

interface AiState {
  insights: Record<string, AiInsight>
  pending: Record<string, boolean>
  errors: Record<string, string | undefined>
}

const initialState: AiState = {
  insights: indexInsights(fixtureInsights),
  pending: {},
  errors: {},
}

function putInsight(state: AiState, insight: AiInsight): void {
  const key = insightKey(insight.kind, insight.targetId, insight.model)
  state.insights[key] = insight
  state.pending[`${insight.kind}:${insight.targetId}`] = false
  state.errors[`${insight.kind}:${insight.targetId}`] = undefined
}

export const probeOllama = createAsyncThunk("ai/probe", async (_, { dispatch }) => {
  const ready = await ollamaAdapter.probe()
  dispatch(setOllamaStatus(ready ? "ready" : "unavailable"))
  return ready
})

async function runGenerate(
  kind: AiInsightKind,
  targetId: string,
  targetType: AiInsight["targetType"],
  modelId: string,
  prompt: string,
): Promise<AiInsight> {
  const model = getModelById(modelId)
  const content = await ollamaAdapter.generate({
    model: model.ollamaName,
    prompt,
  })
  return {
    kind,
    targetId,
    targetType,
    content,
    model: modelId,
    generatedAt: new Date().toISOString(),
  }
}

export const generateGist = createAsyncThunk(
  "ai/gist",
  async (
    args: { threadId: string; subject: string; excerpt: string },
    { getState, rejectWithValue },
  ) => {
    const { session } = getState() as { session: SessionSlice }
    try {
      return await runGenerate(
        "gist",
        args.threadId,
        "thread",
        session.selectedModelId,
        prompts.gist(args.subject, args.excerpt, userName(session.currentUserId)),
      )
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Gist failed")
    }
  },
)

export const generateSummary = createAsyncThunk(
  "ai/summary",
  async (
    args: { messageId: string; body: string },
    { getState, rejectWithValue },
  ) => {
    const { session } = getState() as { session: SessionSlice }
    try {
      return await runGenerate(
        "summary",
        args.messageId,
        "message",
        session.selectedModelId,
        prompts.summary(args.body),
      )
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Summary failed",
      )
    }
  },
)

export const generateReply = createAsyncThunk(
  "ai/reply",
  async (
    args: { messageId: string; threadText: string; tone: ReplyTone },
    { getState, rejectWithValue },
  ) => {
    const { session } = getState() as { session: SessionSlice }
    try {
      return await runGenerate(
        "reply",
        args.messageId,
        "message",
        session.selectedModelId,
        prompts.reply(
          userName(session.currentUserId),
          args.tone,
          args.threadText,
        ),
      )
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Reply failed",
      )
    }
  },
)

export const generateInboxBrief = createAsyncThunk(
  "ai/brief",
  async (
    args: { cacheId: string; threadLines: string },
    { getState, rejectWithValue },
  ) => {
    const { session } = getState() as { session: SessionSlice }
    try {
      return await runGenerate(
        "inbox_brief",
        args.cacheId,
        "inbox",
        session.selectedModelId,
        prompts.inboxBrief(userName(session.currentUserId), args.threadLines),
      )
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Brief failed",
      )
    }
  },
)

export const generateOrgNarrative = createAsyncThunk(
  "ai/org",
  async (args: { stats: string }, { getState, rejectWithValue }) => {
    const { session } = getState() as { session: SessionSlice }
    try {
      return await runGenerate(
        "org_narrative",
        "org",
        "org",
        session.selectedModelId,
        prompts.orgNarrative(args.stats),
      )
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Narrative failed",
      )
    }
  },
)

export const generateComposeDraft = createAsyncThunk(
  "ai/compose",
  async (args: { intent: string }, { getState, rejectWithValue }) => {
    const { session } = getState() as { session: SessionSlice }
    try {
      return await ollamaAdapter.generate({
        model: getModelById(session.selectedModelId).ollamaName,
        prompt: prompts.compose(args.intent, userName(session.currentUserId)),
      })
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Draft failed",
      )
    }
  },
)

const aiSlice = createSlice({
  name: "ai",
  initialState,
  reducers: {
    dismissError: (state, action: PayloadAction<string>) => {
      state.errors[action.payload] = undefined
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateGist.pending, (state, action) => {
        state.pending[`gist:${action.meta.arg.threadId}`] = true
      })
      .addCase(generateGist.fulfilled, (state, action) => {
        putInsight(state, action.payload)
      })
      .addCase(generateGist.rejected, (state, action) => {
        const id = `gist:${action.meta.arg.threadId}`
        state.pending[id] = false
        state.errors[id] = String(action.payload ?? action.error.message)
      })
      .addCase(generateSummary.pending, (state, action) => {
        state.pending[`summary:${action.meta.arg.messageId}`] = true
      })
      .addCase(generateSummary.fulfilled, (state, action) => {
        putInsight(state, action.payload)
      })
      .addCase(generateSummary.rejected, (state, action) => {
        const id = `summary:${action.meta.arg.messageId}`
        state.pending[id] = false
        state.errors[id] = String(action.payload ?? action.error.message)
      })
      .addCase(generateReply.pending, (state, action) => {
        state.pending[`reply:${action.meta.arg.messageId}`] = true
      })
      .addCase(generateReply.fulfilled, (state, action) => {
        putInsight(state, action.payload)
      })
      .addCase(generateReply.rejected, (state, action) => {
        const id = `reply:${action.meta.arg.messageId}`
        state.pending[id] = false
        state.errors[id] = String(action.payload ?? action.error.message)
      })
      .addCase(generateInboxBrief.pending, (state, action) => {
        state.pending[`inbox_brief:${action.meta.arg.cacheId}`] = true
      })
      .addCase(generateInboxBrief.fulfilled, (state, action) => {
        putInsight(state, action.payload)
      })
      .addCase(generateInboxBrief.rejected, (state, action) => {
        const id = `inbox_brief:${action.meta.arg.cacheId}`
        state.pending[id] = false
        state.errors[id] = String(action.payload ?? action.error.message)
      })
      .addCase(generateOrgNarrative.fulfilled, (state, action) => {
        putInsight(state, action.payload)
      })
      .addCase(generateOrgNarrative.rejected, (state, action) => {
        state.errors["org_narrative:org"] = String(
          action.payload ?? action.error.message,
        )
      })
  },
})

export const { dismissError } = aiSlice.actions
export default aiSlice.reducer
