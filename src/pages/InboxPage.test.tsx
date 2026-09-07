import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { Provider } from "react-redux"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { AppShell } from "@/components/layout/AppShell"
import { InboxPage } from "@/pages/InboxPage"
import ComposePage from "@/pages/ComposePage"
import { createAppStore } from "@/store"

function FolderInbox() {
  const location = useLocation()
  return <InboxPage pathname={location.pathname} />
}

function renderAt(path: string) {
  const store = createAppStore()
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/inbox" element={<FolderInbox />} />
            <Route path="/inbox/:threadId" element={<FolderInbox />} />
            <Route path="/compose" element={<ComposePage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

describe("inbox render", () => {
  it("renders the inbox shell, thread, and new-thread link", () => {
    renderAt("/inbox/t-q3")
    expect(screen.getByText("INBOX/AI")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "New thread" })).toHaveAttribute(
      "href",
      "/compose",
    )
    expect(
      screen.getAllByText("Q3 numbers for the board pack").length,
    ).toBeGreaterThan(0)
    expect(screen.getByText("← Inbox")).toBeInTheDocument()
  })

  it("renders compose for a new thread", () => {
    renderAt("/compose")
    expect(
      screen.getByRole("heading", { name: "New thread" }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Subject")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument()
  })

  it("hides the thread pane until a real thread is selected", () => {
    renderAt("/inbox")
    expect(screen.queryByText("Thread not found.")).not.toBeInTheDocument()
    expect(screen.queryByText("Select a thread")).not.toBeInTheDocument()
    expect(screen.queryByText("← Inbox")).not.toBeInTheDocument()
  })

  it("does not show a not-found pane for an unknown thread id", () => {
    renderAt("/inbox/does-not-exist")
    expect(screen.queryByText("Thread not found.")).not.toBeInTheDocument()
    expect(screen.queryByText("Select a thread")).not.toBeInTheDocument()
  })

  it("keeps the thread pane populated after switching threads", async () => {
    const user = userEvent.setup()
    renderAt("/inbox/t-soc2")
    expect(
      screen.getByRole("heading", {
        name: "Re: Vendor security review — SOC2 gap",
      }),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole("option", { name: /Q3 numbers for the board pack/ }),
    )

    expect(
      screen.getByRole("heading", { name: "Q3 numbers for the board pack" }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Reply body")).toBeInTheDocument()
  })
})
