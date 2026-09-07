import { getOllamaUrl } from "@/config/models"
import type { GenerateArgs, LlmAdapter } from "@/services/llm/types"

async function generate({ model, prompt }: GenerateArgs): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 45_000)
  try {
    const response = await fetch(`${getOllamaUrl()}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: false }),
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new Error(`Ollama HTTP ${response.status}`)
    }
    const data = (await response.json()) as { response?: string }
    const text = data.response?.trim()
    if (!text) throw new Error("Empty Ollama response")
    return text
  } finally {
    clearTimeout(timeout)
  }
}

async function probe(): Promise<boolean> {
  try {
    const response = await fetch(`${getOllamaUrl()}/api/tags`, {
      signal: AbortSignal.timeout(2500),
    })
    return response.ok
  } catch {
    return false
  }
}

export const ollamaAdapter: LlmAdapter = { probe, generate }
