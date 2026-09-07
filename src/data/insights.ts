import type { AiInsight } from "@/types/mail"

const MODEL = "llama3.1"
const AT = "2026-09-04T09:41:00.000Z"

export const seedInsights: AiInsight[] = [
  {
    targetType: "thread",
    targetId: "t-q3",
    kind: "gist",
    content:
      "Priya needs the Q3 revenue table by Friday; she is blocked on your finance export.",
    model: MODEL,
    generatedAt: AT,
  },
  {
    targetType: "thread",
    targetId: "t-soc2",
    kind: "gist",
    content:
      "Two SOC2 controls are still unowned; legal wants a name before Thursday.",
    model: MODEL,
    generatedAt: AT,
  },
  {
    targetType: "thread",
    targetId: "t-onboarding",
    kind: "gist",
    content:
      "Sam applied your edits and is waiting on sign-off. No blockers.",
    model: MODEL,
    generatedAt: AT,
  },
  {
    targetType: "thread",
    targetId: "t-pricing",
    kind: "gist",
    content:
      "Variant B lifted trials 9%; Dana asks whether to ship it or extend two weeks.",
    model: MODEL,
    generatedAt: AT,
  },
  {
    targetType: "thread",
    targetId: "t-standup",
    kind: "gist",
    content:
      "Status only. Two items slipped: search indexing and the CSV importer.",
    model: MODEL,
    generatedAt: AT,
  },
  {
    targetType: "thread",
    targetId: "t-hiring",
    kind: "gist",
    content: "You sent the debrief Monday; Priya has not decided yet.",
    model: MODEL,
    generatedAt: AT,
  },
  {
    targetType: "thread",
    targetId: "t-invoice",
    kind: "gist",
    content:
      "Finance moved terms to net-45; Marta needs you to confirm before it goes out.",
    model: MODEL,
    generatedAt: AT,
  },
  {
    targetType: "thread",
    targetId: "t-csv",
    kind: "gist",
    content: "Importer dies around 40k rows; Jonah wants eyes before Monday's trial.",
    model: MODEL,
    generatedAt: AT,
  },
  {
    targetType: "thread",
    targetId: "t-search",
    kind: "gist",
    content: "You closed the reindex; waiting to hear if Lee still sees stale hits.",
    model: MODEL,
    generatedAt: AT,
  },
  {
    targetType: "thread",
    targetId: "t-access",
    kind: "gist",
    content: "Lee needs staging VPN and warehouse role before the contractor starts Monday.",
    model: MODEL,
    generatedAt: AT,
  },
  {
    targetType: "thread",
    targetId: "t-fx",
    kind: "gist",
    content: "Marta asked you to spot-check the EUR row on the FX tab.",
    model: MODEL,
    generatedAt: AT,
  },
  {
    targetType: "thread",
    targetId: "t-legal",
    kind: "gist",
    content: "Priya needs a named security owner before Helio will countersign the DPA.",
    model: MODEL,
    generatedAt: AT,
  },
  {
    targetType: "thread",
    targetId: "t-okrs",
    kind: "gist",
    content: "You sent the Q4 OKR draft; no reply yet from Priya or Sam.",
    model: MODEL,
    generatedAt: AT,
  },
  {
    targetType: "thread",
    targetId: "t-office",
    kind: "gist",
    content: "Dana assigned you a window desk unless you object.",
    model: MODEL,
    generatedAt: AT,
  },
  {
    targetType: "thread",
    targetId: "t-retro",
    kind: "gist",
    content: "Sam wants to keep Friday demos and drop the mid-week checkpoint.",
    model: MODEL,
    generatedAt: AT,
  },
  {
    targetType: "thread",
    targetId: "t-budget",
    kind: "gist",
    content: "Dana cut two licenses and needs sign-off to close the FY27 line.",
    model: MODEL,
    generatedAt: AT,
  },
  {
    targetType: "thread",
    targetId: "t-only-sent",
    kind: "gist",
    content: "You asked Jonah about lunch; no reply yet.",
    model: MODEL,
    generatedAt: AT,
  },
  {
    targetType: "inbox",
    targetId: "inbox-alex-default",
    kind: "inbox_brief",
    content: [
      "Reply to Priya on the Q3 numbers — she is blocked on your finance export and the board pack closes Friday.",
      "Name an owner for the two open SOC2 controls before Thursday's legal review.",
      "Two threads are waiting on other people: the platform hiring debrief (3 days) and Sam's onboarding copy.",
    ].join("\n"),
    model: MODEL,
    generatedAt: AT,
  },
  {
    targetType: "message",
    targetId: "m-q3-3",
    kind: "summary",
    content: [
      "Priya needs the Q3 revenue table in the board pack by Friday 12:00.",
      "She is blocked on the finance export Alex owns; the FX tab Marta added is fine.",
      "She asks whether the two restated months should be footnoted or re-cut.",
    ].join("\n"),
    model: MODEL,
    generatedAt: AT,
  },
  {
    targetType: "message",
    targetId: "m-q3-3",
    kind: "reply",
    content:
      "Priya — I'll run the full Q3 export and send the revenue table by Thursday EOD, so you have a day before print.\n\nOn the restatement: footnote it. Re-cutting the series would break the comparison with the Q2 pack, and the footnote is what the auditors expect.\n\nMarta's FX tab is good to keep as-is.",
    model: MODEL,
    generatedAt: AT,
  },
  {
    targetType: "org",
    targetId: "org",
    kind: "org_narrative",
    content:
      "Three threads older than five days are still waiting on Alex, all of them inbound from finance. Marta carries the highest volume but replies fastest, so the queue is not a capacity problem. Jonah has sent nothing in eleven days on threads he is named in — worth a check.",
    model: MODEL,
    generatedAt: AT,
  },
]
