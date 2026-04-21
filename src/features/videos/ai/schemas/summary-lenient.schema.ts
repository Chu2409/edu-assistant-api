import { z } from 'zod'

export const summaryLenientSchema = z
  .object({
    title: z.unknown().optional(),
    whatYouLearn: z.unknown().optional(),
    keyConcepts: z.unknown().optional(),
    examples: z.unknown().optional(),
    summary: z.unknown().optional(),
  })
  .passthrough()
