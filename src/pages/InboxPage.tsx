import { useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { EmailView } from "@/components/mail/EmailView"
import { InboxBrief } from "@/components/mail/InboxBrief"
import { PaginationBar } from "@/components/mail/PaginationBar"
import { SearchFilterBar } from "@/components/mail/SearchFilterBar"
import { ThreadList } from "@/components/mail/ThreadList"
import { Button } from "@/components/ui/button"
import { fixtureUsers } from "@/data"
import { groupByPerson, threadMessages } from "@/lib/mail"
import { folderFromPath, folderPath } from "@/lib/paths"
import { cn } from "@/lib/utils"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  selectBriefCacheId,
  selectGistMap,
  selectInsight,
  selectPagedThreads,
  selectSmartCounts,
} from "@/store/selectors"
import {
  generateGist,
  generateInboxBrief,
  probeOllama,
} from "@/store/slices/ai-slice"
import {
  clearFilters,
  setDatePreset,
  setGroupByPerson,
  setKeyword,
  setPage,
  setPageSize,
  setPersonId,
  toggleSmartView,
} from "@/store/slices/filters-slice"

interface InboxPageProps {
  pathname: string
}

export function InboxPage({ pathname }: InboxPageProps) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { threadId } = useParams()
  const folder = folderFromPath(pathname)
  const userId = useAppSelector((state) => state.session.currentUserId)
  const filters = useAppSelector((state) => state.filters)
  const paged = useAppSelector((state) => selectPagedThreads(state, folder))
  const smart = useAppSelector((state) => selectSmartCounts(state, folder))
  const gists = useAppSelector(selectGistMap)
  const pending = useAppSelector((state) => state.ai.pending)
  const ollamaStatus = useAppSelector((state) => state.session.ollamaStatus)
  const messages = useAppSelector((state) => state.mail.messages)
  const briefId = useAppSelector((state) => selectBriefCacheId(state, folder))
  const liveBrief = useAppSelector((state) =>
    selectInsight(state, "inbox_brief", briefId),
  )
  const seedBrief = useAppSelector((state) =>
    selectInsight(state, "inbox_brief", "inbox-alex-default"),
  )
  const brief =
    liveBrief ??
    (folder === "inbox" &&
    filters.keyword === "" &&
    filters.datePreset === "all" &&
    filters.smartView === "all" &&
    filters.personId === null &&
    userId === "u-alex"
      ? seedBrief
      : undefined)

  const usersById = Object.fromEntries(fixtureUsers.map((user) => [user.id, user]))
  const empty = paged.total === 0
  const grouped = filters.groupByPerson
    ? groupByPerson(paged.items, fixtureUsers)
    : undefined

  useEffect(() => {
    if (ollamaStatus !== "ready") return
    for (const item of paged.items) {
      if (gists[item.thread.id]) continue
      void dispatch(
        generateGist({
          threadId: item.thread.id,
          subject: item.thread.subject,
          excerpt: item.lastMessage.body.slice(0, 800),
        }),
      )
    }
  }, [dispatch, gists, ollamaStatus, paged.items])

  useEffect(() => {
    if (empty || brief || ollamaStatus !== "ready") return
    const lines = paged.items
      .map(
        (item) =>
          `${item.thread.subject} [${item.urgency}] ${item.lastMessage.body.slice(0, 180)}`,
      )
      .join("\n")
    void dispatch(generateInboxBrief({ cacheId: briefId, threadLines: lines }))
  }, [brief, briefId, dispatch, empty, ollamaStatus, paged.items])

  const bullets = brief?.content.split("\n").filter(Boolean) ?? []
  const selectedIndex = paged.items.findIndex((item) => item.thread.id === threadId)
  const selectedThread = paged.items.find((item) => item.thread.id === threadId)
  const messageCount = selectedThread
    ? threadMessages(selectedThread.thread.id, messages).length
    : 0
  const positionLabel =
    selectedIndex >= 0
      ? `Thread ${paged.fromIndex + selectedIndex} of ${paged.total}`
      : ""

  return (
    <div className="flex min-h-0 min-w-0 flex-1">
      <section
        className={cn(
          "flex min-w-0 flex-1 flex-col md:max-w-[42rem] md:border-r",
          threadId && "hidden md:flex",
        )}
      >
        <h1 className="sr-only">
          {folder === "inbox" ? "Inbox" : folder === "unread" ? "Unread" : "Sent"}
        </h1>
        <SearchFilterBar
          keyword={filters.keyword}
          datePreset={filters.datePreset}
          smartView={filters.smartView}
          groupByPerson={filters.groupByPerson}
          personId={filters.personId}
          needsReply={smart.needsReply}
          waiting={smart.waiting}
          people={fixtureUsers}
          currentUserId={userId}
          onKeywordChange={(value) => dispatch(setKeyword(value))}
          onDatePresetChange={(value) => dispatch(setDatePreset(value))}
          onSmartViewToggle={(value) => dispatch(toggleSmartView(value))}
          onGroupByPerson={(value) => dispatch(setGroupByPerson(value))}
          onPersonChange={(value) => dispatch(setPersonId(value))}
          onClear={() => dispatch(clearFilters())}
        />
        <InboxBrief
          bullets={bullets}
          pending={Boolean(pending[`inbox_brief:${briefId}`])}
          unavailable={ollamaStatus === "unavailable"}
          generatedAt={brief?.generatedAt}
          model={brief?.model}
          threadCount={paged.items.length}
          emptySet={empty}
          onRetry={() => void dispatch(probeOllama())}
        />
        {empty ? (
          <div className="flex flex-1 flex-col items-start justify-center gap-3 px-6">
            <p className="text-sm font-medium">
              {filters.keyword
                ? `Nothing matches “${filters.keyword}”`
                : "Nothing in this folder"}
            </p>
            <p className="max-w-md text-sm text-zinc-500">
              The brief is hidden rather than invented — there is no work to report
              on an empty set.
            </p>
            <div className="flex gap-2">
              {filters.datePreset !== "all" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => dispatch(setDatePreset("all"))}
                >
                  Clear date filter
                </Button>
              ) : null}
              <Button type="button" size="sm" onClick={() => dispatch(clearFilters())}>
                Clear all
              </Button>
            </div>
          </div>
        ) : (
          <ThreadList
            items={paged.items}
            grouped={grouped}
            selectedId={threadId}
            gists={gists}
            pending={pending}
            usersById={usersById}
            currentUserId={userId}
            onOpen={(id) => navigate(`${folderPath(folder)}/${id}`)}
          />
        )}
        <PaginationBar
          fromIndex={paged.fromIndex}
          toIndex={paged.toIndex}
          total={paged.total}
          page={filters.page}
          pageSize={filters.pageSize}
          onPageChange={(page) => dispatch(setPage(page))}
          onPageSizeChange={(size) => dispatch(setPageSize(size))}
        />
      </section>
      {threadId ? (
        <EmailView
          threadId={threadId}
          folderPath={folderPath(folder)}
          positionLabel={
            messageCount
              ? `${positionLabel} · ${messageCount} messages`
              : positionLabel
          }
        />
      ) : (
        <div className="hidden min-w-0 flex-1 items-center justify-center border-l text-sm text-zinc-400 lg:flex">
          Select a thread
        </div>
      )}
    </div>
  )
}
