import { createSelector } from "@reduxjs/toolkit"

import { fixtureUsers } from "@/data"
import {
  filterHash,
  filterThreads,
  folderCounts,
  paginateThreads,
  smartViewCounts,
} from "@/lib/mail"
import { insightKey } from "@/services/llm/types"
import type { RootState } from "@/store"
import type { Folder } from "@/types/mail"

const selectMail = (state: RootState) => state.mail
const selectSession = (state: RootState) => state.session
const selectFilters = (state: RootState) => state.filters
const selectAi = (state: RootState) => state.ai

export const selectCurrentUser = createSelector(
  [selectSession],
  (session) =>
    fixtureUsers.find((user) => user.id === session.currentUserId) ??
    fixtureUsers[0],
)

export function selectUsers() {
  return fixtureUsers
}

export const selectGistMap = createSelector(
  [selectAi, selectSession],
  (ai, session) => {
    const map: Record<string, string> = {}
    for (const insight of Object.values(ai.insights)) {
      if (insight.kind !== "gist" || insight.model !== session.selectedModelId) {
        continue
      }
      map[insight.targetId] = insight.content
    }
    return map
  },
)

export const selectMailQuery = createSelector(
  [selectSession, selectFilters, (_state: RootState, folder: Folder) => folder],
  (session, filters, folder) => ({
    userId: session.currentUserId,
    folder,
    keyword: filters.keyword,
    datePreset: filters.datePreset,
    customRange: filters.customRange,
    personId: filters.personId,
    smartView: filters.smartView,
    page: filters.page,
    pageSize: filters.pageSize,
  }),
)

export const selectFilteredThreads = createSelector(
  [selectMail, selectMailQuery, selectGistMap],
  (mail, query, gists) =>
    filterThreads(mail.threads, mail.messages, query, gists),
)

export const selectPagedThreads = createSelector(
  [selectFilteredThreads, selectFilters],
  (filtered, filters) =>
    paginateThreads(filtered, filters.page, filters.pageSize),
)

export const selectFolderCounts = createSelector(
  [selectMail, selectSession],
  (mail, session) =>
    folderCounts(mail.threads, mail.messages, session.currentUserId),
)

export const selectSmartCounts = createSelector(
  [selectMail, selectMailQuery, selectGistMap],
  (mail, query, gists) =>
    smartViewCounts(
      mail.threads,
      mail.messages,
      {
        userId: query.userId,
        folder: query.folder,
        keyword: query.keyword,
        datePreset: query.datePreset,
        customRange: query.customRange,
        personId: query.personId,
      },
      gists,
    ),
)

export const selectBriefCacheId = createSelector(
  [selectMailQuery, selectSession],
  (query, session) =>
    filterHash({
      ...query,
      modelId: session.selectedModelId,
    }),
)

export function selectInsight(
  state: RootState,
  kind: string,
  targetId: string,
) {
  const key = insightKey(kind, targetId, state.session.selectedModelId)
  return state.ai.insights[key]
}
