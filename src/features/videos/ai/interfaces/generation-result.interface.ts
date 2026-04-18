import { z } from 'zod'
import { summarySchema } from '../schemas/summary.schema'
import { flashcardsSchema } from '../schemas/flashcards.schema'
import { quizSchema } from '../schemas/quiz.schema'
import { glossarySchema } from '../schemas/glossary.schema'

export interface GenerationError {
  type: string
  error: string
  rawSnippet?: string
}

export interface TokenUsage {
  input: number
  output: number
}

export interface GenerationResult {
  summary?: z.infer<typeof summarySchema>
  flashcards?: z.infer<typeof flashcardsSchema>
  quiz?: z.infer<typeof quizSchema>
  glossary?: z.infer<typeof glossarySchema>
  errors: GenerationError[]
  totalTokens: TokenUsage
  provider?: string
  model?: string
}
