import { z } from 'zod'
import { summarySchema } from '../schemas/summary.schema'
import { flashcardsSchema } from '../schemas/flashcards.schema'
import { quizSchema } from '../schemas/quiz.schema'
import { glossarySchema } from '../schemas/glossary.schema'

export interface GenerationInput {
  transcription: string
  language: string
  videoTitle: string
}

export interface GenerationResult {
  summary?: z.infer<typeof summarySchema>
  flashcards?: z.infer<typeof flashcardsSchema>
  quiz?: z.infer<typeof quizSchema>
  glossary?: z.infer<typeof glossarySchema>
  errors: Array<{ type: string; error: string }>
  totalTokens: { input: number; output: number }
  provider?: string
  model?: string
}
