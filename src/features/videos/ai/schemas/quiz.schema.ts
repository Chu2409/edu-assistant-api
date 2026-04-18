import { z } from 'zod'

export const quizSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        options: z.array(z.string().min(1)).length(4),
        correctAnswer: z.number().int().min(0).max(3),
        explanation: z.string().min(1),
      }),
    )
    .min(1),
})
