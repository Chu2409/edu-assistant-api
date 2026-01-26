export const QUEUE_NAMES = {
  CONCEPTS: {
    NAME: 'concepts',
    JOBS: {
      PROCESS: 'process-concepts',
    },
  },
} as const satisfies Record<
  string,
  { NAME: string; JOBS: Record<string, string> }
>
