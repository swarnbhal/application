import { lazy, Suspense } from "react"
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom"

import { AppShell } from "@/components/layout/AppShell"
import { InboxPage } from "@/pages/InboxPage"

const ComposePage = lazy(() => import("@/pages/ComposePage"))
const ActivityPage = lazy(() => import("@/pages/ActivityPage"))

function FolderInbox() {
  const location = useLocation()
  return <InboxPage pathname={location.pathname} />
}

function App() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="flex min-h-svh items-center justify-center text-sm text-zinc-500">
            Loading…
          </div>
        }
      >
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/inbox" replace />} />
            <Route path="/inbox" element={<FolderInbox />} />
            <Route path="/inbox/:threadId" element={<FolderInbox />} />
            <Route path="/unread" element={<FolderInbox />} />
            <Route path="/unread/:threadId" element={<FolderInbox />} />
            <Route path="/sent" element={<FolderInbox />} />
            <Route path="/sent/:threadId" element={<FolderInbox />} />
            <Route path="/compose" element={<ComposePage />} />
            <Route path="/activity" element={<ActivityPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
