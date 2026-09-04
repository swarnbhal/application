import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"

async function fetchGreeting(): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return "Hello from React Query"
}

function App() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["greeting"],
    queryFn: fetchGreeting,
  })

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-8">
      <div className="max-w-md space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          React Starter
        </h1>
        <p className="text-muted-foreground">
          Vite + React + Tailwind + shadcn/ui + TanStack Query
        </p>
      </div>

      <div className="flex min-h-10 items-center justify-center rounded-lg border bg-card px-6 py-4 text-sm">
        {isLoading ? "Loading..." : data}
      </div>

      <Button onClick={() => refetch()} disabled={isFetching}>
        {isFetching ? "Fetching..." : "Refetch data"}
      </Button>
    </main>
  )
}

export default App
