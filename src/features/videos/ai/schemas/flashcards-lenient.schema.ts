import { z } from 'zod'

export const flashcardsLenientSchema = z
  .object({
    items: z.unknown().optional(),
  })
  .passthrough()
