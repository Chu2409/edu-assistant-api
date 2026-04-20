import { z } from 'zod'

export const glossaryLenientSchema = z
  .object({
    terms: z.unknown().optional(),
  })
  .passthrough()
