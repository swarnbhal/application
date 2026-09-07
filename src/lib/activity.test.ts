import { activityEvents } from "@/data/activity"
import { messages } from "@/data/messages"
import { threads } from "@/data/threads"
import { users } from "@/data/users"
import {
  computeOrgMetrics,
  orgNarrativePayload,
} from "@/lib/activity"

const from = "2026-08-01T00:00:00.000Z"
const to = "2026-09-04T23:59:59.000Z"
const now = "2026-09-04T12:00:00.000Z"

describe("P0-ACT activity metrics", () => {
  it("P0-ACT-01 counts match ranged messages; empty range is zero", () => {
    const metrics = computeOrgMetrics(
      users,
      threads,
      messages,
      activityEvents,
      from,
      to,
      now,
    )
    expect(metrics.sent).toBe(messages.filter((message) => message.sentAt >= from && message.sentAt <= to).length)
    expect(metrics.received).toBeGreaterThan(0)
    expect(metrics.perUser).toHaveLength(users.length)

    const empty = computeOrgMetrics(
      users,
      threads,
      messages,
      activityEvents,
      "2020-01-01T00:00:00.000Z",
      "2020-01-02T00:00:00.000Z",
      now,
    )
    expect(empty.sent).toBe(0)
    expect(empty.received).toBe(0)
  })

  it("P0-ACT-02 unanswered uses last-sender needs_reply for Alex", () => {
    const metrics = computeOrgMetrics(
      users,
      threads,
      messages,
      activityEvents,
      from,
      to,
      now,
    )
    const alex = metrics.perUser.find((row) => row.userId === "u-alex")
    expect(alex).toBeDefined()
    expect(alex!.unanswered).toBeGreaterThan(0)
  })

  it("P0-AI-05 narrative payload has no message bodies", () => {
    const metrics = computeOrgMetrics(
      users,
      threads,
      messages,
      activityEvents,
      from,
      to,
      now,
    )
    const payload = orgNarrativePayload(metrics)
    expect(payload).toContain("sent=")
    expect(payload).not.toContain("board pack")
    expect(payload).not.toContain("finance export")
  })
})
