/**
 * Constants for notification-related entity types.
 * These are used to identify the source entity when creating notifications.
 */
export const ENTITY_TYPES = {
  LEARNING_OBJECT: 'LearningObject',
  MODULE: 'Module',
  STUDENT_AI_FEEDBACK: 'StudentAiFeedback',
  TEACHER_AI_FEEDBACK: 'TeacherAiFeedback',
  ACTIVITY: 'Activity',
  QUESTION: 'StudentQuestion',
  ENROLLMENT: 'Enrollment',
} as const

export type EntityType = (typeof ENTITY_TYPES)[keyof typeof ENTITY_TYPES]
