import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { QUEUE_NAMES } from 'src/shared/constants/queues'
import { EnrollmentsService } from '../enrollments.service'

@Processor(QUEUE_NAMES.ENROLLMENTS.NAME)
export class EnrollmentsWorker extends WorkerHost {
  private readonly logger = new Logger(EnrollmentsWorker.name)

  constructor(private readonly enrollmentsService: EnrollmentsService) {
    super()
  }

  async process(job: Job): Promise<unknown> {
    switch (job.name) {
      case QUEUE_NAMES.ENROLLMENTS.JOBS.DAILY_SUMMARY:
        return this.handleDailySummary()
      default:
        this.logger.warn(`Unknown job name: ${job.name}`)
    }
  }

  private async handleDailySummary() {
    this.logger.log('Iniciando envío de resúmenes diarios de inscripciones...')

    try {
      await this.enrollmentsService.sendDailySummaries()
      this.logger.log('Resúmenes diarios de inscripciones enviados con éxito')
      return { success: true }
    } catch (error) {
      this.logger.error(
        'Error enviando resúmenes diarios de inscripciones:',
        error,
      )
      throw error
    }
  }
}
