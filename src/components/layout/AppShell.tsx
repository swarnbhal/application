import { useEffect } from "react"
import { NavLink, Outlet } from "react-router-dom"

import { buttonVariants } from "@/components/ui/button"
import { canViewActivity } from "@/lib/session"
import { cn } from "@/lib/utils"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { selectCurrentUser, selectFolderCounts, selectUsers } from "@/store/selectors"
import { probeOllama } from "@/store/slices/ai-slice"
import { clearFilters } from "@/store/slices/filters-slice"
import { setCurrentUserId } from "@/store/slices/session-slice"

const folders = [
  { to: "/inbox", label: "Inbox", key: "inbox" as const },
  { to: "/unread", label: "Unread", key: "unread" as const },
  { to: "/sent", label: "Sent", key: "sent" as const },
]

export function AppShell() {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectCurrentUser)
  const users = selectUsers()
  const counts = useAppSelector(selectFolderCounts)
  const ollamaStatus = useAppSelector((state) => state.session.ollamaStatus)
  const isAdmin = canViewActivity(user.role)

  useEffect(() => {
    void dispatch(probeOllama())
  }, [dispatch])

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-sidebar-border bg-sidebar px-4 py-2.5 text-sidebar-foreground">
        <p className="text-[11px] font-semibold tracking-[0.28em] text-sidebar-foreground">
          INBOX/AI
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[11px] tracking-[0.14em] text-sidebar-foreground/60 uppercase">
            Current user
            <select
              aria-label="Current user"
              value={user.id}
              onChange={(event) => {
                dispatch(setCurrentUserId(event.target.value))
                dispatch(clearFilters())
              }}
              className="select-field h-8 rounded-lg border border-sidebar-border/60 pl-2.5 text-sm font-normal tracking-normal text-foreground normal-case outline-none focus-visible:border-sidebar-ring focus-visible:ring-3 focus-visible:ring-sidebar-ring/40"
            >
              {users.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.role}
                </option>
              ))}
            </select>
          </label>
          <p
            className={cn(
              "text-xs",
              ollamaStatus === "ready" && "text-sky-200",
              ollamaStatus === "unavailable" && "text-rose-300",
              ollamaStatus === "unknown" && "status-pulse text-sidebar-foreground/70",
            )}
            aria-live="polite"
          >
            {ollamaStatus === "ready"
              ? "AI ready"
              : ollamaStatus === "unavailable"
                ? "AI unavailable"
                : "Checking AI…"}
          </p>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <nav
          aria-label="Folders"
          className="flex w-48 shrink-0 flex-col border-r border-sidebar-border bg-sidebar py-3 text-sidebar-foreground"
        >
          {folders.map((folder) => (
            <NavLink
              key={folder.to}
              to={folder.to}
              className={({ isActive }) =>
                cn(
                  "mx-2 flex items-baseline justify-between rounded-lg px-3 py-2 text-sm outline-none transition-colors duration-200 focus-visible:ring-3 focus-visible:ring-sidebar-ring/50",
                  isActive
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                )
              }
            >
              {folder.label}
              <span className="text-xs tabular-nums opacity-70">
                {counts[folder.key]}
              </span>
            </NavLink>
          ))}
          <NavLink
            to="/compose"
            className={cn(
              buttonVariants(),
              "mx-3 mt-4 bg-sidebar-primary text-sidebar-primary-foreground shadow-sm hover:bg-sidebar-primary/90",
            )}
          >
            New thread
          </NavLink>
          {isAdmin ? (
            <NavLink
              to="/activity"
              className={({ isActive }) =>
                cn(
                  "mx-2 mt-4 rounded-lg px-3 py-2 text-sm outline-none transition-colors duration-200 focus-visible:ring-3 focus-visible:ring-sidebar-ring/50",
                  isActive
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                )
              }
            >
              Activity
            </NavLink>
          ) : (
            <p className="mt-4 px-5 text-[11px] leading-4 text-sidebar-foreground/50">
              Activity is hidden for members. {user.name.split(" ")[0]} is a
              member.
            </p>
          )}
        </nav>
        <div className="flex min-h-0 min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
