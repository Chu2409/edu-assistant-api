/**
 * Constants for AI Feedback scopes.
 * Used to categorize different types of AI-generated feedback.
 */
export const AI_FEEDBACK_SCOPES = {
  WEEKLY_DIGEST: 'WEEKLY_DIGEST',
  DAILY_SUMMARY: 'DAILY_SUMMARY',
  ACTIVITY_REVIEW: 'ACTIVITY_REVIEW',
  MODULE_COMPLETION: 'MODULE_COMPLETION',
} as const

export type AiFeedbackScope =
  (typeof AI_FEEDBACK_SCOPES)[keyof typeof AI_FEEDBACK_SCOPES]
