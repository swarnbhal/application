import type { LlmModel } from "@/types/mail"

export const SUPPORTED_MODELS: readonly LlmModel[] = [
  {
    id: "llama3.1",
    label: "llama3.1",
    ollamaName: "llama3.1",
  },
]

export const DEFAULT_MODEL_ID = SUPPORTED_MODELS[0].id

export function getOllamaUrl(): string {
  const explicit = import.meta.env?.VITE_OLLAMA_URL
  if (explicit) return explicit
  if (import.meta.env?.DEV) return "/ollama"
  return "http://127.0.0.1:11434"
}

export function getModelById(id: string): LlmModel {
  return SUPPORTED_MODELS.find((model) => model.id === id) ?? SUPPORTED_MODELS[0]
}
