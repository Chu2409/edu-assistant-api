import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { QUEUE_NAMES } from 'src/shared/constants/queues'
import { EmailService } from '../email.service'
import type { QueuedEmailJob } from '../interfaces/queued-email-job.interface'

@Processor(QUEUE_NAMES.EMAIL_QUEUE.NAME)
export class EmailQueueWorker extends WorkerHost {
  private readonly logger = new Logger(EmailQueueWorker.name)

  constructor(private readonly emailService: EmailService) {
    super()
  }

  async process(job: Job<QueuedEmailJob>): Promise<unknown> {
    switch (job.name) {
      case QUEUE_NAMES.EMAIL_QUEUE.JOBS.SEND_EMAIL:
        return this.handleSendEmail(job.data)
      default:
        this.logger.warn(`Unknown job name: ${job.name}`)
    }
  }

  private async handleSendEmail(data: QueuedEmailJob) {
    this.logger.log(
      `Processing queued email to ${data.to} (retry #${data.retryCount}, originally queued at ${new Date(data.originalTimestamp).toISOString()})`,
    )

    try {
      const result = await this.emailService.sendWithTemplate(
        data.to,
        data.subject,
        data.template,
        data.data,
      )

      this.logger.log(
        `Queued email to ${data.to}: sent=${result.sent}, queued=${result.queued}`,
      )
      return { success: true, ...result }
    } catch (error) {
      this.logger.error(`Error processing queued email to ${data.to}:`, error)
      throw error
    }
  }
}
