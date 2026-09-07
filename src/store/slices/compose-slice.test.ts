import { applySuggestedReply, resetReply } from "./compose-slice"
import { createAppStore } from "@/store"

describe("P0-AI apply vs send", () => {
  it("P0-AI-04 apply copies into composer and does not append a message", () => {
    const store = createAppStore()
    const before = store.getState().mail.messages.length
    store.dispatch(applySuggestedReply("I will send the table Thursday."))
    expect(store.getState().compose.replyBody).toBe(
      "I will send the table Thursday.",
    )
    expect(store.getState().compose.appliedAi).toBe(true)
    expect(store.getState().mail.messages.length).toBe(before)
    store.dispatch(resetReply())
    expect(store.getState().compose.appliedAi).toBe(false)
  })
})
