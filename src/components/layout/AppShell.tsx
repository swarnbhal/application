import { useEffect } from "react"
import { NavLink, Outlet } from "react-router-dom"

import { buttonVariants } from "@/components/ui/button"
import { SUPPORTED_MODELS } from "@/config/models"
import { canViewActivity } from "@/lib/session"
import { cn } from "@/lib/utils"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { selectCurrentUser, selectFolderCounts, selectUsers } from "@/store/selectors"
import { probeOllama } from "@/store/slices/ai-slice"
import { clearFilters } from "@/store/slices/filters-slice"
import {
  setCurrentUserId,
  setSelectedModelId,
} from "@/store/slices/session-slice"

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
  const modelId = useAppSelector((state) => state.session.selectedModelId)
  const ollamaStatus = useAppSelector((state) => state.session.ollamaStatus)
  const isAdmin = canViewActivity(user.role)

  useEffect(() => {
    void dispatch(probeOllama())
  }, [dispatch])

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5">
        <p className="text-[11px] font-medium tracking-[0.28em] text-zinc-700">
          INBOX/AI
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[11px] tracking-[0.14em] text-zinc-400 uppercase">
            Current user
            <select
              aria-label="Current user"
              value={user.id}
              onChange={(event) => {
                dispatch(setCurrentUserId(event.target.value))
                dispatch(clearFilters())
              }}
              className="select-field h-8 rounded-lg border border-border pl-2.5 text-sm font-normal tracking-normal text-foreground normal-case outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {users.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.role}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-[11px] tracking-[0.14em] text-zinc-400 uppercase">
            Language model
            <select
              aria-label="Language model"
              value={modelId}
              onChange={(event) => dispatch(setSelectedModelId(event.target.value))}
              className="select-field h-8 rounded-lg border border-border pl-2.5 text-sm font-normal tracking-normal text-foreground normal-case outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {SUPPORTED_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label}
                </option>
              ))}
            </select>
          </label>
          <p
            className={cn(
              "text-xs",
              ollamaStatus === "ready" ? "text-zinc-600" : "text-zinc-400",
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
          className="flex w-44 shrink-0 flex-col border-r py-3"
        >
          {folders.map((folder) => (
            <NavLink
              key={folder.to}
              to={folder.to}
              className={({ isActive }) =>
                cn(
                  "flex items-baseline justify-between px-4 py-1.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  isActive
                    ? "font-medium text-foreground"
                    : "text-zinc-600 hover:text-foreground",
                )
              }
            >
              {folder.label}
              <span className="text-xs tabular-nums text-zinc-400">
                {counts[folder.key]}
              </span>
            </NavLink>
          ))}
          <NavLink
            to="/compose"
            className={cn(buttonVariants(), "mx-3 mt-4")}
          >
            New thread
          </NavLink>
          {isAdmin ? (
            <NavLink
              to="/activity"
              className={({ isActive }) =>
                cn(
                  "mt-4 px-4 py-1.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  isActive
                    ? "font-medium text-foreground"
                    : "text-zinc-600 hover:text-foreground",
                )
              }
            >
              Activity
            </NavLink>
          ) : (
            <p className="mt-4 px-4 text-[11px] leading-4 text-zinc-400">
              Activity is hidden for members. {user.name.split(" ")[0]} is a
              member.
            </p>
          )}
        </nav>
        <Outlet />
      </div>
    </div>
  )
}
