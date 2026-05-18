import { z } from 'zod'

const feedbackItemSchema = z.object({
  topic: z.string().min(1),
  detail: z.string().min(1),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
})

/**
 * Schema for teacher AI feedback (LO-level and module-level).
 * Output: { summary, strengths[], improvements[], recommendations[] }
 */
export const teacherFeedbackContentSchema = z.object({
  summary: z.string().min(1),
  strengths: z.array(feedbackItemSchema),
  improvements: z.array(feedbackItemSchema),
  recommendations: z.array(feedbackItemSchema),
})

/**
 * Schema for student AI feedback (weekly digest).
 * Same structure as teacher feedback.
 */
export const studentFeedbackContentSchema = z.object({
  summary: z.string().min(1),
  strengths: z.array(feedbackItemSchema),
  improvements: z.array(feedbackItemSchema),
  recommendations: z.array(feedbackItemSchema),
})
