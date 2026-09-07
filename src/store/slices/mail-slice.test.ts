import { createAppStore } from "@/store"
import { appendEvent } from "@/store/slices/activity-slice"
import { createThread, replyToThread } from "@/store/slices/mail-slice"
import { setCurrentUserId } from "@/store/slices/session-slice"
import { isComposeValid } from "@/lib/mail"

describe("P0-SEND mail mutations", () => {
  it("P0-SEND-01 reply marks recipients unread, not the sender", () => {
    const store = createAppStore()
    store.dispatch(
      replyToThread({
        threadId: "t-q3",
        fromUserId: "u-alex",
        toUserIds: ["u-priya", "u-marta"],
        body: "Export is on the way.",
      }),
    )
    const thread = store
      .getState()
      .mail.threads.find((item) => item.id === "t-q3")
    expect(thread?.unreadByUserIds).toEqual(
      expect.arrayContaining(["u-priya", "u-marta"]),
    )
    expect(thread?.unreadByUserIds).not.toContain("u-alex")
    const last = store.getState().mail.messages.at(-1)
    expect(last?.body).toBe("Export is on the way.")
    expect(last?.fromUserId).toBe("u-alex")
  })

  it("P0-SEND-02 createThread no-ops when invalid", () => {
    const store = createAppStore()
    const before = store.getState().mail.threads.length
    expect(isComposeValid([], "Hi", "Body")).toBe(false)
    store.dispatch(
      createThread({
        fromUserId: "u-alex",
        toUserIds: [],
        subject: "Hi",
        body: "Body",
      }),
    )
    expect(store.getState().mail.threads.length).toBe(before)
  })

  it("P0-SEND-03 valid compose appears in sender Sent and recipient Inbox", () => {
    const store = createAppStore()
    store.dispatch(
      createThread({
        fromUserId: "u-alex",
        toUserIds: ["u-priya"],
        subject: "Board print window",
        body: "I can send the table Thursday.",
      }),
    )
    const created = store
      .getState()
      .mail.threads.find((thread) => thread.subject === "Board print window")
    expect(created).toBeDefined()
    expect(created?.unreadByUserIds).toEqual(["u-priya"])
    expect(created?.participantIds).toEqual(
      expect.arrayContaining(["u-alex", "u-priya"]),
    )
  })

  it("P0-SEND-04 and P0-SESS-03 activity logging", () => {
    const store = createAppStore()
    const before = store.getState().activity.events.length
    store.dispatch(setCurrentUserId("u-priya"))
    expect(store.getState().activity.events.length).toBe(before)

    store.dispatch(
      appendEvent({
        actorUserId: "u-priya",
        type: "email_sent",
        threadId: "t-q3",
        subject: "Q3 numbers for the board pack",
      }),
    )
    const latest = store.getState().activity.events[0]
    expect(latest.actorUserId).toBe("u-priya")
    expect(latest.type).toBe("email_sent")
  })
})
