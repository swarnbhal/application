import { Link } from "react-router-dom"

import { QuietMarker } from "@/components/ai/QuietMarker"
import { PaginationBar } from "@/components/mail/PaginationBar"
import { Button } from "@/components/ui/button"
import { fixtureUsers } from "@/data"
import { computeOrgMetrics, formatDuration, orgNarrativePayload } from "@/lib/activity"
import { formatRelativeTime } from "@/lib/mail"
import { canViewActivity } from "@/lib/session"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { selectCurrentUser, selectInsight } from "@/store/selectors"
import { generateOrgNarrative } from "@/store/slices/ai-slice"
import { setTimelinePage } from "@/store/slices/activity-slice"

const usersById = Object.fromEntries(fixtureUsers.map((user) => [user.id, user]))

export default function ActivityPage() {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectCurrentUser)
  const threads = useAppSelector((state) => state.mail.threads)
  const messages = useAppSelector((state) => state.mail.messages)
  const activity = useAppSelector((state) => state.activity)
  const narrative = useAppSelector((state) =>
    selectInsight(state, "org_narrative", "org"),
  )

  if (!canViewActivity(user.role)) {
    return (
      <main className="flex flex-1 flex-col items-start justify-center gap-3 px-10">
        <h1 className="text-lg font-medium">Activity is for admins</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {user.name.split(" ")[0]} is a member, so there is nothing here — not an
          error, and no data behind it.
        </p>
        <Link
          to="/inbox"
          className="text-sm underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Back to inbox
        </Link>
      </main>
    )
  }

  const metrics = computeOrgMetrics(
    fixtureUsers,
    threads,
    messages,
    activity.events,
    activity.rangeFrom,
    activity.rangeTo,
    "2026-09-04T12:00:00.000Z",
  )
  const ranged = activity.events.filter(
    (event) =>
      event.timestamp >= activity.rangeFrom &&
      event.timestamp <= activity.rangeTo,
  )
  const start = (activity.timelinePage - 1) * activity.timelinePageSize
  const pageEvents = ranged.slice(start, start + activity.timelinePageSize)

  const kpis = [
    {
      label: "Sent",
      value: String(metrics.sent),
      hint: `across ${fixtureUsers.length} users`,
    },
    {
      label: "Received",
      value: String(metrics.received),
      hint: `across ${fixtureUsers.length} users`,
    },
    {
      label: "Median reply",
      value: formatDuration(metrics.medianReplyMs),
      hint: "from send pairs",
    },
    {
      label: "Unanswered",
      value: String(metrics.unanswered),
      hint: `${metrics.unansweredOlderThanDays} older than 5 days`,
    },
    {
      label: "AI apply rate",
      value:
        metrics.aiApplyRate === null
          ? "—"
          : `${Math.round(metrics.aiApplyRate * 100)}%`,
      hint: "of suggested replies",
    },
  ]

  return (
    <main className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 flex min-h-0 flex-1 flex-col overflow-auto px-6 py-5">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
            Inbox/AI
          </p>
          <h1 className="text-lg font-medium tracking-tight">
            Activity · all users
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">1 Aug – 4 Sep</p>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <article
            key={kpi.label}
            className="rounded-xl border border-border bg-card px-3 py-3 shadow-sm transition-transform duration-200 motion-safe:hover:-translate-y-0.5"
          >
            <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              {kpi.label}
            </p>
            <p className="mt-1 text-2xl font-medium tabular-nums">{kpi.value}</p>
            <p className="text-xs text-muted-foreground">{kpi.hint}</p>
          </article>
        ))}
      </section>
      <section className="mt-6 rounded-xl border border-border bg-card px-4 py-4 shadow-sm">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            Machine read · org narrative
          </h2>
          <p className="text-[11px] tracking-wide text-muted-foreground">
            From aggregates + event types · no message bodies
          </p>
        </div>
        {narrative ? (
          <p className="flex items-start gap-2 text-sm leading-relaxed text-foreground">
            <QuietMarker className="mt-1.5" />
            <span>{narrative.content}</span>
          </p>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              void dispatch(
                generateOrgNarrative({ stats: orgNarrativePayload(metrics) }),
              )
            }
          >
            Write narrative
          </Button>
        )}
      </section>
      <section className="mt-6">
        <h2 className="mb-2 text-sm font-medium">Per user</h2>
        <p className="mb-2 text-xs text-muted-foreground">
          Drill-down shows subject and age only — never bodies.
        </p>
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
              <tr>
                <th className="px-3 py-2 font-medium">User</th>
                <th className="px-3 py-2 font-medium">Sent</th>
                <th className="px-3 py-2 font-medium">Recv</th>
                <th className="px-3 py-2 font-medium">Median reply</th>
                <th className="px-3 py-2 font-medium">Unanswered</th>
                <th className="px-3 py-2 font-medium">AI apply</th>
              </tr>
            </thead>
            <tbody>
              {metrics.perUser.map((row) => (
                <tr key={row.userId} className="border-b last:border-0">
                  <td className="px-3 py-2">{usersById[row.userId]?.name}</td>
                  <td className="px-3 py-2 tabular-nums">{row.sent}</td>
                  <td className="px-3 py-2 tabular-nums">{row.received}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {formatDuration(row.medianReplyMs)}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{row.unanswered}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {row.aiApplyRate === null
                      ? "—"
                      : `${Math.round(row.aiApplyRate * 100)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="mt-6">
        <h2 className="mb-2 text-sm font-medium">Timeline</h2>
        <ol className="divide-y divide-border rounded-xl border border-border bg-card shadow-sm">
          {pageEvents.map((event) => (
            <li key={event.id} className="flex gap-3 px-3 py-2 text-sm">
              <time className="w-12 shrink-0 tabular-nums text-muted-foreground">
                {formatRelativeTime(event.timestamp)}
              </time>
              <p>
                {usersById[event.actorUserId]?.name}{" "}
                {event.type.replaceAll("_", " ")}
                {event.meta?.subject ? ` · ${event.meta.subject}` : ""}
                {event.type === "ai_reply_applied" ? (
                  <span className="ml-2 text-[11px] text-muted-foreground">
                    ai_reply_applied
                  </span>
                ) : null}
              </p>
            </li>
          ))}
        </ol>
        {ranged.length === 0 ? (
          <p className="rounded-xl border border-border px-3 py-6 text-sm text-muted-foreground">
            No events in this range.
          </p>
        ) : (
          <PaginationBar
            fromIndex={ranged.length === 0 ? 0 : start + 1}
            toIndex={start + pageEvents.length}
            total={ranged.length}
            page={activity.timelinePage}
            pageSize={activity.timelinePageSize}
            onPageChange={(page) => dispatch(setTimelinePage(page))}
          />
        )}
      </section>
    </main>
  )
}
