import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { QUEUE_NAMES } from 'src/shared/constants/queues'
import { PageRelationsService } from '../../page-relations/page-relations.service'

@Processor(QUEUE_NAMES.EMBEDDINGS.NAME)
export class EmbeddingsWorker extends WorkerHost {
  private readonly logger = new Logger(EmbeddingsWorker.name)

  constructor(private readonly pageRelationsService: PageRelationsService) {
    super()
  }

  async process(job: Job): Promise<unknown> {
    switch (job.name) {
      case QUEUE_NAMES.EMBEDDINGS.JOBS.PROCESS_PAGE:
        return this.handleProcessPageEmbedding(job)
      default:
        this.logger.warn(`Unknown job name: ${job.name}`)
    }
  }

  private async handleProcessPageEmbedding(job: Job<{ pageId: number }>) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (job.data == null) {
      return
    }

    const { pageId } = job.data

    this.logger.log(`Procesando embedding para la página: ${pageId}...`)

    try {
      await this.pageRelationsService.processPageEmbedding(pageId)
      this.logger.log(`Embedding generado correctamente para página ${pageId}`)
      return { pageId, success: true }
    } catch (error) {
      this.logger.error(
        `Error al procesar embedding para página ${pageId}:`,
        error,
      )
      throw error
    }
  }
}
