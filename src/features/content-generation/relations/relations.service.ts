import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { OpenaiService } from 'src/providers/ai/services/openai.service'
import {
  generatePageRelationsPrompt,
  type GeneratePageRelationsPromptInput,
} from './prompts/generate-relations.prompt'
import { GenerateRelationsDto } from './dtos/req/generate-relations.dto'
import { GeneratedRelationsDto } from './dtos/res/generated-relations.dto'
import { PageRelationsService } from '../../pages/page-relations/page-relations.service'
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
    private readonly pageRelationsService: PageRelationsService,
  ) {}

  async generatePageRelations(
    data: GenerateRelationsDto,
  ): Promise<GeneratedRelationsDto> {
    this.logger.log('Generating page relations')

    const page = await this.dbService.page.findUnique({
      where: { id: data.pageId },
      include: {
        blocks: { orderBy: { orderIndex: 'asc' } },
      },
    })

    if (!page) {
      throw new NotFoundException(`Page with id ${data.pageId} not found`)
    }

    if (page.blocks.length === 0) {
      throw new BadRequestException('Page has no blocks')
    }

    // 1. Procesar embedding de la página para poder buscar similares
    const embeddingLiteral =
      await this.pageRelationsService.ensurePageEmbedding(data.pageId)

    // 2. Obtener páginas similares por embedding
    const minSimilarity = data.minSimilarity ?? 0.5
    const similarRows = await this.pageRelationsService.findSimilarPages({
      embeddingLiteral,
      moduleId: page.moduleId,
      originPageId: data.pageId,
      onlyPublished: false,
      minSimilarity,
    })

    if (similarRows.length === 0) {
      return { relations: [] }
    }

    // 3. Obtener datos de las páginas candidatas (title, summary, keywords)
    const candidateIds = similarRows.map((r) => r.id)
    const candidatePages = await this.dbService.page.findMany({
      where: { id: { in: candidateIds } },
      include: {
        blocks: true,
      },
    })

    const candidatePagesForPrompt: GeneratePageRelationsPromptInput['candidatePages'] =
      candidatePages.map((p) => ({
        id: p.id,
        title: p.title,
        summary: (p.compiledContent ?? '').slice(0, 200).trim() || p.title,
        keywords: p.keywords,
      }))

    // 4. Construir bloques de la página actual para el prompt
    const currentPageBlocks = page.blocks.map((b) => ({
      type: b.type,
      content: parseJsonField<AiContent>(b.content),
    }))

    const maxRelationsPerPage = data.maxRelationsPerPage ?? 5

    const prompt = generatePageRelationsPrompt({
      currentPage: {
        id: page.id,
        title: page.title,
        blocks: currentPageBlocks,
      },
      candidatePages: candidatePagesForPrompt,
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
