export interface AgentExecutionResult {
  data: unknown
  inputTokens: number
  outputTokens: number
  needsReview: boolean
}
