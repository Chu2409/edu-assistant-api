import { z } from 'zod'

export const flashcardsSchema = z.object({
  items: z.array(
    z.object({
      front: z.string(),
      back: z.string(),
    }),
  ),
})
