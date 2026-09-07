import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

import type { DatePreset, DateRange, SmartView } from "@/types/mail"

export type PageSize = 10 | 25 | 50

interface FiltersState {
  keyword: string
  datePreset: DatePreset
  customRange: DateRange
  personId: string | null
  smartView: SmartView
  groupByPerson: boolean
  page: number
  pageSize: PageSize
}

const initialState: FiltersState = {
  keyword: "",
  datePreset: "all",
  customRange: { from: null, to: null },
  personId: null,
  smartView: "all",
  groupByPerson: false,
  page: 1,
  pageSize: 10,
}

const filtersSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    setKeyword: (state, action: PayloadAction<string>) => {
      state.keyword = action.payload
      state.page = 1
    },
    setDatePreset: (state, action: PayloadAction<DatePreset>) => {
      state.datePreset = action.payload
      state.page = 1
    },
    setCustomRange: (state, action: PayloadAction<DateRange>) => {
      state.customRange = action.payload
      state.datePreset = "custom"
      state.page = 1
    },
    setPersonId: (state, action: PayloadAction<string | null>) => {
      state.personId = action.payload
      state.page = 1
    },
    setSmartView: (state, action: PayloadAction<SmartView>) => {
      state.smartView = action.payload
      state.page = 1
    },
    toggleSmartView: (state, action: PayloadAction<Exclude<SmartView, "all">>) => {
      state.smartView =
        state.smartView === action.payload ? "all" : action.payload
      state.page = 1
    },
    setGroupByPerson: (state, action: PayloadAction<boolean>) => {
      state.groupByPerson = action.payload
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = Math.max(1, action.payload)
    },
    setPageSize: (state, action: PayloadAction<PageSize>) => {
      state.pageSize = action.payload
      state.page = 1
    },
    clearFilters: (state) => {
      state.keyword = ""
      state.datePreset = "all"
      state.customRange = { from: null, to: null }
      state.personId = null
      state.smartView = "all"
      state.groupByPerson = false
      state.page = 1
    },
  },
})

export const {
  setKeyword,
  setDatePreset,
  setCustomRange,
  setPersonId,
  setSmartView,
  toggleSmartView,
  setGroupByPerson,
  setPage,
  setPageSize,
  clearFilters,
} = filtersSlice.actions
export default filtersSlice.reducer
