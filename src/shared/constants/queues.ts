export const EMAIL_DAILY_LIMIT = 1000

export const QUEUE_NAMES = {
  CONCEPTS: {
    NAME: 'concepts',
    JOBS: {
      PROCESS: 'process-concepts',
    },
  },
  EMBEDDINGS: {
    NAME: 'embeddings',
    JOBS: {
      PROCESS_LO: 'process-lo-embedding',
    },
  },
  TEACHER_FEEDBACK: {
    NAME: 'teacher-feedback',
    JOBS: {
      GENERATE_ALL: 'generate-all-feedbacks',
      GENERATE_MODULE: 'generate-module-feedback',
    },
  },
  ENROLLMENTS: {
    NAME: 'enrollments',
    JOBS: {
      DAILY_SUMMARY: 'daily-enrollment-summary',
    },
  },
  VIDEOS: {
    NAME: 'videos',
    JOBS: {
      PROCESS: 'process-video',
      RETRY: 'retry-video-content',
    },
  },
  FEEDBACK_DIGEST: {
    NAME: 'feedback-digest',
    JOBS: {
      WEEKLY_DIGEST: 'weekly-feedback-digest',
    },
  },
  STUDENT_FEEDBACK_DIGEST: {
    NAME: 'student-feedback-digest',
    JOBS: {
      WEEKLY_DIGEST: 'student-weekly-feedback-digest',
    },
  },
  STUDENT_AI_FEEDBACK: {
    NAME: 'student-ai-feedback',
    JOBS: {
      GENERATE_ALL: 'generate-all-student-feedbacks',
      GENERATE_STUDENT: 'generate-student-feedback',
      SEND_STUDENT_EMAIL: 'send-student-email',
    },
  },
} as const satisfies Record<
  string,
  { NAME: string; JOBS: Record<string, string> }
>
