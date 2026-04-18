import { z } from 'zod'
import { summarySchema } from '../schemas/summary.schema'
import { flashcardsSchema } from '../schemas/flashcards.schema'
import { quizSchema } from '../schemas/quiz.schema'
import { glossarySchema } from '../schemas/glossary.schema'
import { GenerationError } from './generation-error.interface'
import { TokenUsage } from './token-usage.interface'

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
