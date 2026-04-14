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
} as const satisfies Record<
  string,
  { NAME: string; JOBS: Record<string, string> }
>
