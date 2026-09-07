export function insightKey(
  kind: string,
  targetId: string,
  modelId: string,
): string {
  return `${kind}:${targetId}:${modelId}`
}

export interface GenerateArgs {
  model: string
  prompt: string
}

export interface LlmAdapter {
  probe: () => Promise<boolean>
  generate: (args: GenerateArgs) => Promise<string>
}
