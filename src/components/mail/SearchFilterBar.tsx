import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { cn } from "@/lib/utils"
import type { DatePreset, SmartView } from "@/types/mail"
import type { User } from "@/types/mail"

interface SearchFilterBarProps {
  keyword: string
  datePreset: DatePreset
  smartView: SmartView
  groupByPerson: boolean
  personId: string | null
  needsReply: number
  waiting: number
  people: User[]
  currentUserId: string
  onKeywordChange: (value: string) => void
  onDatePresetChange: (value: DatePreset) => void
  onSmartViewToggle: (value: Exclude<SmartView, "all">) => void
  onGroupByPerson: (value: boolean) => void
  onPersonChange: (value: string | null) => void
  onClear: () => void
}

const DATE_OPTIONS: { value: DatePreset; label: string }[] = [
  { value: "all", label: "Any time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
]

export function SearchFilterBar({
  keyword,
  datePreset,
  smartView,
  groupByPerson,
  personId,
  needsReply,
  waiting,
  people,
  currentUserId,
  onKeywordChange,
  onDatePresetChange,
  onSmartViewToggle,
  onGroupByPerson,
  onPersonChange,
  onClear,
}: SearchFilterBarProps) {
  const [draft, setDraft] = useState(keyword)
  const debounced = useDebouncedValue(draft, 300)

  useEffect(() => {
    setDraft(keyword)
  }, [keyword])

  useEffect(() => {
    if (debounced !== keyword) onKeywordChange(debounced)
  }, [debounced, keyword, onKeywordChange])

  const filtered =
    keyword.trim() !== "" ||
    datePreset !== "all" ||
    smartView !== "all" ||
    personId !== null

  const summary = [
    keyword.trim() ? "keyword" : null,
    datePreset === "all" ? null : DATE_OPTIONS.find((o) => o.value === datePreset)?.label,
    smartView === "needs_reply" ? "needs reply" : smartView === "waiting" ? "waiting" : null,
    personId ? "person" : null,
  ].filter(Boolean)

  return (
    <div className="flex flex-col gap-2 border-b px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="thread-search">
          Find a thread
        </label>
        <input
          id="thread-search"
          type="search"
          placeholder="Find the invoice thread"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="h-8 min-w-48 flex-1 rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <label className="sr-only" htmlFor="date-preset">
          Date range
        </label>
        <select
          id="date-preset"
          value={datePreset}
          onChange={(event) =>
            onDatePresetChange(event.target.value as DatePreset)
          }
          className="select-field h-8 rounded-lg border border-border pl-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {DATE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button
          type="button"
          size="sm"
          variant={smartView === "needs_reply" ? "secondary" : "outline"}
          aria-pressed={smartView === "needs_reply"}
          onClick={() => onSmartViewToggle("needs_reply")}
        >
          Needs reply {needsReply}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={smartView === "waiting" ? "secondary" : "outline"}
          aria-pressed={smartView === "waiting"}
          onClick={() => onSmartViewToggle("waiting")}
        >
          Waiting {waiting}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={groupByPerson ? "secondary" : "outline"}
          aria-pressed={groupByPerson}
          onClick={() => onGroupByPerson(!groupByPerson)}
        >
          Group by person
        </Button>
        <label className="sr-only" htmlFor="person-filter">
          Filter by person
        </label>
        <select
          id="person-filter"
          value={personId ?? ""}
          onChange={(event) =>
            onPersonChange(event.target.value === "" ? null : event.target.value)
          }
          className="select-field h-8 rounded-lg border border-border pl-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Anyone</option>
          {people
            .filter((user) => user.id !== currentUserId)
            .map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
        </select>
        <Button type="button" size="sm" variant="ghost" onClick={onClear}>
          Clear all
        </Button>
      </div>
      {filtered ? (
        <p className={cn("text-[11px] tracking-wide text-zinc-500")}>
          Filtered: {summary.join(" ∩ ")}
        </p>
      ) : null}
    </div>
  )
}
