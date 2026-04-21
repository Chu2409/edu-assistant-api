import { z } from 'zod'

export const summarySchema = z.object({
  title: z.string(),
  whatYouLearn: z.array(z.string()),
  keyConcepts: z.array(z.string()),
  examples: z.array(z.string()),
  summary: z.string(),
})
