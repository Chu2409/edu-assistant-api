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
      PROCESS_PAGE: 'process-page-embedding',
    },
  },
} as const satisfies Record<
  string,
  { NAME: string; JOBS: Record<string, string> }
>
