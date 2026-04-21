import {
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { BusinessException } from 'src/shared/exceptions/business.exception'
import { DBService } from 'src/core/database/database.service'
import { OpenaiService } from 'src/providers/ai/services/openai.service'
import {
  generatePageRelationsPrompt,
  type GeneratePageRelationsPromptInput,
} from './prompts/generate-relations.prompt'
import { GenerateRelationsDto } from './dtos/req/generate-relations.dto'
import { GeneratedRelationsDto } from './dtos/res/generated-relations.dto'
import { LoRelationsService } from '../../learning-objects/lo-relations/lo-relations.service'
import type { AiContent } from '../shared/interfaces/ai-generated-content.interface'
import { parseJsonField } from 'src/providers/ai/helpers/utils'
import { validateAiResponse } from 'src/providers/ai/helpers/ai-response-validator'
import { generatedRelationsSchema } from '../shared/schemas/ai-content.schema'

@Injectable()
export class RelationsService {
  private readonly logger = new Logger(RelationsService.name)

  constructor(
    private readonly dbService: DBService,
    private readonly openAiService: OpenaiService,
    private readonly loRelationsService: LoRelationsService,
  ) {}

  async generateLoRelations(
    data: GenerateRelationsDto,
  ): Promise<GeneratedRelationsDto> {
    this.logger.log('Generando relaciones del objeto de aprendizaje')

    const lo = await this.dbService.learningObject.findUnique({
      where: { id: data.learningObjectId },
      include: {
        blocks: { orderBy: { orderIndex: 'asc' } },
      },
    })

    if (!lo) {
      throw new NotFoundException(
        `Objeto de aprendizaje con ID ${data.learningObjectId} no encontrado`,
      )
    }

    if (lo.blocks.length === 0) {
      throw new BusinessException(
        'El objeto de aprendizaje no tiene bloques',
        HttpStatus.BAD_REQUEST,
      )
    }

    // 1. Procesar embedding para poder buscar similares
    const embeddingLiteral = await this.loRelationsService.ensurePageEmbedding(
      data.learningObjectId,
    )

    // 2. Obtener objetos de aprendizaje similares por embedding
    const minSimilarity = data.minSimilarity ?? 0.5
    const similarRows = await this.loRelationsService.findSimilarPages({
      embeddingLiteral,
      moduleId: lo.moduleId,
      originLoId: data.learningObjectId,
      onlyPublished: false,
      minSimilarity,
    })

    if (similarRows.length === 0) {
      return { relations: [] }
    }

    // 3. Obtener datos de los candidatos (title, summary, keywords)
    const candidateIds = similarRows.map((r) => r.id)
    const candidateLos = await this.dbService.learningObject.findMany({
      where: { id: { in: candidateIds } },
      include: {
        blocks: true,
      },
    })

    const candidateLosForPrompt: GeneratePageRelationsPromptInput['candidatePages'] =
      candidateLos.map((p) => ({
        id: p.id,
        title: p.title,
        summary: (p.compiledContent ?? '').slice(0, 200).trim() || p.title,
        keywords: p.keywords,
      }))

    // 4. Construir bloques del objeto de aprendizaje actual para el prompt
    const currentLoBlocks = lo.blocks.map((b) => ({
      type: b.type,
      content: parseJsonField<AiContent>(b.content),
    }))

    const maxRelationsPerPage = data.maxRelationsPerPage ?? 5

    const prompt = generatePageRelationsPrompt({
      currentPage: {
        id: lo.id,
        title: lo.title,
        blocks: currentLoBlocks,
      },
      candidatePages: candidateLosForPrompt,
      config: {
        maxRelationsPerPage,
      },
    })

    const aiResponse =
      await this.openAiService.getResponse<GeneratedRelationsDto>(prompt)

    return validateAiResponse(
      aiResponse.content,
      generatedRelationsSchema,
    ) as GeneratedRelationsDto
  }
}
