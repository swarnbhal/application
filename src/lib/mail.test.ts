import { activityEvents } from "@/data/activity"
import { messages } from "@/data/messages"
import { threads } from "@/data/threads"
import { users } from "@/data/users"
import {
  NOW,
  filterHash,
  filterThreads,
  folderCounts,
  groupByPerson,
  isComposeValid,
  paginateThreads,
  smartViewCounts,
  urgencyFor,
  type MailQuery,
} from "@/lib/mail"

const alex = "u-alex"
const priya = "u-priya"

function baseQuery(overrides: Partial<MailQuery> = {}): MailQuery {
  return {
    userId: alex,
    folder: "inbox",
    keyword: "",
    datePreset: "all",
    customRange: { from: null, to: null },
    personId: null,
    smartView: "all",
    page: 1,
    pageSize: 10,
    ...overrides,
  }
}

describe("P0-MAIL mailbox scope", () => {
  it("P0-MAIL-01 Inbox for Alex excludes Priya-only threads", () => {
    const result = filterThreads(threads, messages, baseQuery())
    const ids = result.map((item) => item.thread.id)
    expect(ids).toContain("t-q3")
    expect(ids).not.toContain("t-priya-only")
  })

  it("P0-MAIL-02 Unread is participating plus unreadByUserIds", () => {
    const unread = filterThreads(
      threads,
      messages,
      baseQuery({ folder: "unread" }),
    )
    expect(unread.every((item) => item.unread)).toBe(true)
    expect(unread.some((item) => item.thread.id === "t-q3")).toBe(true)
    expect(unread.some((item) => item.thread.id === "t-onboarding")).toBe(
      false,
    )
  })

  it("P0-MAIL-03 Sent includes threads Alex wrote", () => {
    const sent = filterThreads(threads, messages, baseQuery({ folder: "sent" }))
    const ids = sent.map((item) => item.thread.id)
    expect(ids).toContain("t-only-sent")
    expect(ids).toContain("t-q3")
    expect(ids).not.toContain("t-invoice")
  })

  it("P0-MAIL-04 switching user changes folder contents", () => {
    const alexInbox = filterThreads(threads, messages, baseQuery())
    const priyaInbox = filterThreads(
      threads,
      messages,
      baseQuery({ userId: priya }),
    )
    const alexIds = alexInbox.map((item) => item.thread.id)
    const priyaIds = priyaInbox.map((item) => item.thread.id)
    expect(priyaIds).toContain("t-priya-only")
    expect(alexIds).not.toContain("t-priya-only")
    expect(folderCounts(threads, messages, alex).inbox).not.toBe(
      folderCounts(threads, messages, priya).inbox,
    )
  })
})

describe("P0-FILT filter then paginate", () => {
  it("P0-FILT-01 keyword hit and miss", () => {
    const hit = filterThreads(
      threads,
      messages,
      baseQuery({ keyword: "invoice" }),
    )
    expect(hit.map((item) => item.thread.id)).toEqual(["t-invoice"])
    const miss = filterThreads(
      threads,
      messages,
      baseQuery({ keyword: "no-such-token" }),
    )
    expect(miss).toHaveLength(0)
  })

  it("P0-FILT-02 date range excludes older threads", () => {
    const today = filterThreads(
      threads,
      messages,
      baseQuery({ datePreset: "today" }),
    )
    expect(today.every((item) => item.thread.lastMessageAt.startsWith("2026-09-04"))).toBe(
      true,
    )
    expect(today.some((item) => item.thread.id === "t-invoice")).toBe(false)
  })

  it("P0-FILT-03 needs reply vs waiting by last sender", () => {
    const q3 = messages.find((message) => message.id === "m-q3-3")
    expect(q3).toBeDefined()
    expect(urgencyFor(alex, q3!)).toBe("needs_reply")
    const hire = messages.find((message) => message.id === "m-hire-2")
    expect(urgencyFor(alex, hire!)).toBe("waiting")
    const standup = messages.find((message) => message.id === "m-standup-1")
    expect(urgencyFor(alex, standup!)).toBe("fyi")

    const needs = filterThreads(
      threads,
      messages,
      baseQuery({ smartView: "needs_reply" }),
    )
    const waiting = filterThreads(
      threads,
      messages,
      baseQuery({ smartView: "waiting" }),
    )
    expect(needs.some((item) => item.thread.id === "t-q3")).toBe(true)
    expect(waiting.some((item) => item.thread.id === "t-hiring")).toBe(true)
    expect(needs.some((item) => item.thread.id === "t-hiring")).toBe(false)
  })

  it("P0-FILT-04 composed filters and counts", () => {
    const composed = filterThreads(
      threads,
      messages,
      baseQuery({
        keyword: "board pack",
        datePreset: "7d",
        smartView: "needs_reply",
      }),
    )
    expect(composed.map((item) => item.thread.id)).toEqual(["t-q3"])
    const counts = smartViewCounts(
      threads,
      messages,
      {
        userId: alex,
        folder: "inbox",
        keyword: "",
        datePreset: "all",
        customRange: { from: null, to: null },
        personId: null,
      },
    )
    expect(counts.needsReply).toBeGreaterThan(0)
    expect(counts.waiting).toBeGreaterThan(0)
  })

  it("P0-FILT-05 paginate slices without overflow", () => {
    const all = filterThreads(threads, messages, baseQuery({ pageSize: 50 }))
    const page1 = paginateThreads(all, 1, 10)
    expect(page1.items).toHaveLength(Math.min(10, all.length))
    expect(page1.fromIndex).toBe(1)
    const lastPage = Math.ceil(all.length / 10)
    const pageLast = paginateThreads(all, lastPage, 10)
    expect(pageLast.items.length).toBeLessThanOrEqual(10)
    expect(pageLast.toIndex).toBe(all.length)
    const overflow = paginateThreads(all, lastPage + 5, 10)
    expect(overflow.items).toHaveLength(0)
  })

  it("P0-FILT-06 group-by-user clusters the filtered set", () => {
    const filtered = filterThreads(
      threads,
      messages,
      baseQuery({ smartView: "needs_reply" }),
    )
    const groups = groupByPerson(filtered, users)
    const groupedIds = groups.flatMap((group) =>
      group.items.map((item) => item.thread.id),
    )
    expect(groupedIds.sort()).toEqual(
      filtered.map((item) => item.thread.id).sort(),
    )
    expect(groups.every((group) => group.items.length > 0)).toBe(true)
  })
})

describe("compose validation", () => {
  it("P0-SEND-02 rejects missing fields", () => {
    expect(isComposeValid([], "Hi", "Body")).toBe(false)
    expect(isComposeValid(["u-priya"], "  ", "Body")).toBe(false)
    expect(isComposeValid(["u-priya"], "Hi", "  ")).toBe(false)
  })

  it("accepts a complete draft", () => {
    expect(isComposeValid(["u-priya"], "Hi", "Body")).toBe(true)
  })
})

describe("clock", () => {
  it("uses the demo now for relative windows", () => {
    expect(NOW.toISOString()).toBe("2026-09-04T12:00:00.000Z")
    expect(activityEvents.length).toBeGreaterThan(0)
  })
})

describe("P0-AI-03 brief cache key", () => {
  it("changes when user, folder, model, or page changes", () => {
    const base = {
      userId: "u-alex",
      folder: "inbox" as const,
      keyword: "",
      datePreset: "all" as const,
      customRange: { from: null, to: null },
      personId: null,
      smartView: "all" as const,
      page: 1,
      pageSize: 10,
      modelId: "llama3.1",
    }
    const a = filterHash(base)
    const b = filterHash({ ...base, userId: "u-priya" })
    const c = filterHash({ ...base, page: 2 })
    const d = filterHash({ ...base, modelId: "mistral" })
    expect(a).not.toBe(b)
    expect(a).not.toBe(c)
    expect(a).not.toBe(d)
  })
})
