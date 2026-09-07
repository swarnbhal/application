import filtersReducer, {
  clearFilters,
  setDatePreset,
  setKeyword,
  setPage,
  setPageSize,
  toggleSmartView,
} from "./filters-slice"

describe("filters slice", () => {
  it("P0-FILT-04 changing a filter resets page to 1", () => {
    let state = filtersReducer(undefined, setPage(3))
    expect(state.page).toBe(3)
    state = filtersReducer(state, setKeyword("invoice"))
    expect(state.page).toBe(1)
    state = filtersReducer(state, setPage(2))
    state = filtersReducer(state, setDatePreset("7d"))
    expect(state.page).toBe(1)
    state = filtersReducer(state, setPage(2))
    state = filtersReducer(state, toggleSmartView("needs_reply"))
    expect(state.page).toBe(1)
    expect(state.smartView).toBe("needs_reply")
    state = filtersReducer(state, toggleSmartView("needs_reply"))
    expect(state.smartView).toBe("all")
  })

  it("P0-FILT-05 page size resets page", () => {
    let state = filtersReducer(undefined, setPage(2))
    state = filtersReducer(state, setPageSize(25))
    expect(state.pageSize).toBe(25)
    expect(state.page).toBe(1)
  })

  it("clearFilters restores defaults", () => {
    let state = filtersReducer(undefined, setKeyword("invoice"))
    state = filtersReducer(state, setDatePreset("7d"))
    state = filtersReducer(state, clearFilters())
    expect(state.keyword).toBe("")
    expect(state.datePreset).toBe("all")
    expect(state.smartView).toBe("all")
    expect(state.page).toBe(1)
  })
})
