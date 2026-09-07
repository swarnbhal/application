import { combineReducers, configureStore } from "@reduxjs/toolkit"

import activityReducer from "./slices/activity-slice"
import aiReducer from "./slices/ai-slice"
import composeReducer from "./slices/compose-slice"
import filtersReducer from "./slices/filters-slice"
import mailReducer from "./slices/mail-slice"
import sessionReducer from "./slices/session-slice"

export const rootReducer = combineReducers({
  session: sessionReducer,
  mail: mailReducer,
  filters: filtersReducer,
  activity: activityReducer,
  ai: aiReducer,
  compose: composeReducer,
})

export function createAppStore(
  preloadedState?: Partial<ReturnType<typeof rootReducer>>,
) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
  })
}

export const store = createAppStore()

export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch
export type AppStore = ReturnType<typeof createAppStore>
