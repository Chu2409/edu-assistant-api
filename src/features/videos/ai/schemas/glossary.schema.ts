import { z } from 'zod'

export const glossarySchema = z.object({
  terms: z.array(
    z.object({
      term: z.string(),
      definition: z.string(),
    }),
  ),
})
