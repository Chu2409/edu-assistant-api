import { z } from 'zod'

export const quizLenientSchema = z
  .object({
    questions: z.unknown().optional(),
  })
  .passthrough()
