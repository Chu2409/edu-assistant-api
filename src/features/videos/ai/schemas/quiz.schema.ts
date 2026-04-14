import { z } from 'zod'

export const quizSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()).min(2).max(5),
      correctAnswer: z.number().int().min(0).max(4),
      explanation: z.string().optional(),
    }),
  ),
})
