import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, type RenderOptions } from "@testing-library/react"
import type { ReactElement, ReactNode } from "react"
import { Provider } from "react-redux"
import { MemoryRouter } from "react-router-dom"

import { createAppStore, type RootState } from "@/store"

interface ExtendedRenderOptions extends Omit<RenderOptions, "wrapper"> {
  preloadedState?: Partial<RootState>
  route?: string
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState,
    route = "/inbox",
    ...renderOptions
  }: ExtendedRenderOptions = {},
) {
  const store = createAppStore(preloadedState)

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </QueryClientProvider>
      </Provider>
    )
  }

  return {
    store,
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}
