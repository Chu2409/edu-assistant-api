import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { QUEUE_NAMES } from 'src/shared/constants/queues'
import { LoRelationsService } from '../../lo-relations/lo-relations.service'

@Processor(QUEUE_NAMES.EMBEDDINGS.NAME)
export class EmbeddingsWorker extends WorkerHost {
  private readonly logger = new Logger(EmbeddingsWorker.name)

  constructor(private readonly loRelationsService: LoRelationsService) {
    super()
  }

  async process(job: Job): Promise<unknown> {
    switch (job.name) {
      case QUEUE_NAMES.EMBEDDINGS.JOBS.PROCESS_LO:
        return this.handleProcessLoEmbedding(job)
      default:
        this.logger.warn(`Unknown job name: ${job.name}`)
    }
  }

  private async handleProcessLoEmbedding(
    job: Job<{ learningObjectId: number }>,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (job.data == null) {
      return
    }

    const { learningObjectId } = job.data

    this.logger.log(
      `Procesando embedding para el objeto de aprendizaje: ${learningObjectId}...`,
    )

    try {
      await this.loRelationsService.processPageEmbedding(learningObjectId)
      this.logger.log(
        `Embedding generado correctamente para objeto de aprendizaje ${learningObjectId}`,
      )
      return { learningObjectId, success: true }
    } catch (error) {
      this.logger.error(
        `Error al procesar embedding para objeto de aprendizaje ${learningObjectId}:`,
        error,
      )
      throw error
    }
  }
}
