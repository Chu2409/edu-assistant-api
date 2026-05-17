export interface QueuedEmailJob {
  to: string
  subject: string
  template: string
  data: Record<string, any>
  originalTimestamp: number
  retryCount: number
}
