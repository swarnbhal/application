import { MemoryRouter, Route, Routes } from "react-router-dom"
import { Provider } from "react-redux"
import { render, screen } from "@testing-library/react"

import { AppShell } from "@/components/layout/AppShell"
import { InboxPage } from "@/pages/InboxPage"
import ComposePage from "@/pages/ComposePage"
import { createAppStore } from "@/store"

function renderAt(path: string) {
  const store = createAppStore()
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/inbox" element={<InboxPage pathname="/inbox" />} />
            <Route
              path="/inbox/:threadId"
              element={<InboxPage pathname={path} />}
            />
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
  })

  it("renders compose for a new thread", () => {
    renderAt("/compose")
    expect(
      screen.getByRole("heading", { name: "New thread" }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Subject")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument()
  })
})
