import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { DBService } from 'src/core/database/database.service'
import { QUEUE_NAMES } from 'src/shared/constants/queues'
import { BlocksMapper } from '../blocks/mappers/blocks.mapper'
import { ContentGenerationService } from '../content-generation/content-generation.service'
import { AiTextBlock } from '../content-generation/interfaces/ai-generated-content.interface'
import { BlockType } from 'src/core/database/generated/enums'

@Processor(QUEUE_NAMES.CONCEPTS.NAME)
export class ConceptsWorker extends WorkerHost {
  private readonly logger = new Logger(ConceptsWorker.name)

  constructor(
    private readonly dbService: DBService,
    private readonly contentGenerationService: ContentGenerationService,
  ) {
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

    this.logger.log(`Procesando conceptos para la página: ${pageId}...`)

    const page = await this.dbService.page.findUnique({
      where: { id: pageId },
      include: {
        blocks: true,
        module: {
          include: {
            aiConfiguration: true,
          },
        },
      },
    })

    if (!page) {
      this.logger.error(`Página con ID ${pageId} no encontrada.`)
      return
    }

    if (page.blocks.length === 0) {
      this.logger.error(`Página con ID ${pageId} no tiene bloques.`)
      return
    }

    const blocks = page.blocks.map((block) => BlocksMapper.mapToDto(block))

    const concepts = await this.contentGenerationService.extractPageConcepts({
      textBlocks: blocks
        .filter((block) => block.type === BlockType.TEXT)
        .map((block) => block.content as AiTextBlock),
      language: page.module.aiConfiguration?.language ?? 'es',
      targetLevel: page.module.aiConfiguration?.targetLevel ?? 'INTERMEDIATE',
      audience: page.module.aiConfiguration?.audience ?? 'UNIVERSITY',
      maxTerms: 6,
    })

    await Promise.all(
      concepts.terms.map((concept) =>
        this.dbService.pageConcept.create({
          data: { pageId, term: concept.term, definition: concept.definition },
        }),
      ),
    )

    await this.dbService.page.update({
      where: { id: pageId },
      data: { conceptsProcessed: true },
    })

    this.logger.log('Conceptos procesados correctamente.')
    return { sent: true }
  }
}
