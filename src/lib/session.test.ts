import { canViewActivity } from "@/lib/session"

describe("P0-SESS admin gate", () => {
  it("P0-SESS-01 members cannot view activity", () => {
    expect(canViewActivity("member")).toBe(false)
  })

  it("P0-SESS-02 admins can view activity", () => {
    expect(canViewActivity("admin")).toBe(true)
  })
})
