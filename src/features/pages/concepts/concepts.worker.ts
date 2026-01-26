// email.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { DBService } from 'src/core/database/database.service'
import { QUEUE_NAMES } from 'src/shared/constants/queues'

@Processor(QUEUE_NAMES.CONCEPTS.NAME) // Debe coincidir con el nombre de la cola registrada
export class ConceptsWorker extends WorkerHost {
  private readonly logger = new Logger(ConceptsWorker.name)

  constructor(private readonly dbService: DBService) {
    super()
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case QUEUE_NAMES.CONCEPTS.JOBS.PROCESS:
        return this.handleProcessConcepts(job)
      default:
        this.logger.warn(`Unknown job name: ${job.name}`)
    }
  }

  private async handleProcessConcepts(job: Job<{ pageId: number }>) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (job.data == null) {
      return
    }

    const { pageId } = job.data

    console.log(`Procesando email para el usuario: ${job.data.pageId}...`)

    // Simular tarea pesada (ej: llamar a una API de mailing)
    await new Promise((resolve) => setTimeout(resolve, 3000))

    console.log('Email enviado correctamente.')
    return { sent: true }
  }
}
