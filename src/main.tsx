import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App.tsx"
import { QueryProvider } from "./providers/query-provider.tsx"
import { ReduxProvider } from "./providers/redux-provider.tsx"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ReduxProvider>
      <QueryProvider>
        <App />
      </QueryProvider>
    </ReduxProvider>
  </StrictMode>
)
