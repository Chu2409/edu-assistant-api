import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { OpenaiService } from 'src/providers/ai/openai.service'
import { generatePageContentPrompt } from './prompts/generate-page-content.prompt'
import { extractPageConceptsPrompt } from './prompts/extract-page-concepts.prompt'
import { PageConceptsExtractedDto } from './dtos/res/page-concepts-extracted.dto'
import { GeneratedPageContent } from './dtos/res/generated-page-content.dto'
import { GenerateContentDto } from './dtos/req/generate-content.dto'
import { RegenerateContentDto } from './dtos/req/regenarte-content.dto'
import { regeneratePageContentPrompt } from './prompts/regenerate-page-content.prompt'
import { ExtractConceptsDto } from './dtos/req/extract-concepts.dto'
import { BlockType } from 'src/core/database/generated/enums'
import { GenerateActivityDto } from './dtos/req/generate-activity.dto'
import { generateActivityPrompt } from './prompts/generate-activity.prompt'
import type { AiGeneratedActivity } from './interfaces/ai-generated-activity.interface'
import { RegenerateBlockDto } from './dtos/req/regenerate-block.dto'
import { RegeneratedBlockDto } from './dtos/res/regenerated-block.dto'
import { ExpandContentDto } from './dtos/req/expand-content.dto'
import { ExpandedContentDto } from './dtos/res/expanded-content.dto'
import { regenerateBlockPrompt } from './prompts/regenerate-block-prompt'
import { expandContentPrompt } from './prompts/expand-content.prompt'
import {
  generatePageRelationsPrompt,
  type GeneratePageRelationsPromptInput,
} from './prompts/generate-relations.prompt'
import type {
  AiContent,
  AiTextBlock,
  AiCodeBlock,
} from './interfaces/ai-generated-content.interface'
import { PageRelationsService } from '../page-relations/page-relations.service'
import { GenerateRelationsDto } from './dtos/req/generate-relations.dto'
import { GeneratedRelationsDto } from './dtos/res/generated-relations.dto'

@Injectable()
export class ContentGenerationService {
  private readonly logger = new Logger(ContentGenerationService.name)

  /** Prisma devuelve Json como objeto en PostgreSQL; maneja string u objeto */
  private parseJsonField<T = Record<string, unknown>>(value: unknown): T {
    if (typeof value === 'string') return JSON.parse(value) as T
    return value as T
  }

  constructor(
    private readonly dbService: DBService,
    private readonly openAiService: OpenaiService,
    private readonly pageRelationsService: PageRelationsService,
  ) {}

  async generatePageContent(
    data: GenerateContentDto,
  ): Promise<GeneratedPageContent> {
    this.logger.log('Generating page content')

    const page = await this.dbService.page.findUnique({
      where: { id: data.pageId },
      include: { module: { include: { aiConfiguration: true } } },
    })

    if (!page) {
      throw new NotFoundException(`Page with id ${data.pageId} not found`)
    }

    const prompt = generatePageContentPrompt({
      title: page.title,
      instructions: data.instructions,
      config: {
        audience: data.audience ?? page.module.aiConfiguration!.audience,
        contentLength:
          data.contentLength ?? page.module.aiConfiguration!.contentLength,
        language: data.language ?? page.module.aiConfiguration!.language,
        targetLevel:
          data.targetLevel ?? page.module.aiConfiguration!.targetLevel,
        tone: data.tone ?? page.module.aiConfiguration!.tone,
      },
    })
    const aiResponse =
      await this.openAiService.getResponse<GeneratedPageContent>(prompt)

    return aiResponse.content
  }

  async regeneratePageContent(
    data: RegenerateContentDto,
  ): Promise<GeneratedPageContent> {
    this.logger.log('Regenerating page content')

    const page = await this.dbService.page.findUnique({
      where: { id: data.pageId },
      include: {
        blocks: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
        module: { include: { aiConfiguration: true } },
      },
    })

    if (!page) {
      throw new NotFoundException(`Page with id ${data.pageId} not found`)
    }

    const blocks = page.blocks.map((b) => ({
      type: b.type,
      content: this.parseJsonField<AiContent>(b.content),
    }))

    const prompt = regeneratePageContentPrompt({
      title: page.title,
      instructions: data.instructions,
      blocks,
      config: {
        audience: data.audience ?? page.module.aiConfiguration!.audience,
        contentLength:
          data.contentLength ?? page.module.aiConfiguration!.contentLength,
        language: data.language ?? page.module.aiConfiguration!.language,
        targetLevel:
          data.targetLevel ?? page.module.aiConfiguration!.targetLevel,
        tone: data.tone ?? page.module.aiConfiguration!.tone,
      },
    })

    const aiResponse =
      await this.openAiService.getResponse<GeneratedPageContent>(prompt)

    return aiResponse.content
  }

  async regenerateBlock(
    data: RegenerateBlockDto,
  ): Promise<RegeneratedBlockDto> {
    this.logger.log('Regenerating block')

    const page = await this.dbService.page.findUnique({
      where: { id: data.pageId },
      include: {
        blocks: { orderBy: { orderIndex: 'asc' } },
        module: { include: { aiConfiguration: true } },
      },
    })

    if (!page) {
      throw new NotFoundException(`Page with id ${data.pageId} not found`)
    }

    if (page.blocks.length === 0) {
      throw new BadRequestException('Page has no blocks')
    }

    if (data.blockIndex >= page.blocks.length) {
      throw new BadRequestException(
        `Block index ${data.blockIndex} is out of range (page has ${page.blocks.length} blocks)`,
      )
    }

    const block = page.blocks[data.blockIndex]
    const previousBlock =
      data.blockIndex > 0 ? page.blocks[data.blockIndex - 1] : undefined
    const nextBlock =
      data.blockIndex < page.blocks.length - 1
        ? page.blocks[data.blockIndex + 1]
        : undefined

    const config = {
      audience: data.audience ?? page.module.aiConfiguration!.audience,
      language: data.language ?? page.module.aiConfiguration!.language,
      targetLevel: data.targetLevel ?? page.module.aiConfiguration!.targetLevel,
      tone: data.tone ?? page.module.aiConfiguration!.tone,
    }

    const prompt = regenerateBlockPrompt({
      blockIndex: data.blockIndex,
      block: {
        type: block.type,
        content: this.parseJsonField(block.content),
      },
      instruction: data.instruction,
      context: {
        pageTitle: page.title,
        previousBlock: previousBlock
          ? {
              type: previousBlock.type,
              content: this.parseJsonField(previousBlock.content),
            }
          : undefined,
        nextBlock: nextBlock
          ? {
              type: nextBlock.type,
              content: this.parseJsonField(nextBlock.content),
            }
          : undefined,
      },
      config: {
        language: config.language,
        targetLevel: config.targetLevel,
        audience: config.audience,
        tone: config.tone,
      },
    })

    const aiResponse =
      await this.openAiService.getResponse<RegeneratedBlockDto>(prompt)

    return aiResponse.content
  }

  async expandContent(data: ExpandContentDto): Promise<ExpandedContentDto> {
    this.logger.log('Expanding content')

    const page = await this.dbService.page.findUnique({
      where: { id: data.pageId },
      include: {
        blocks: { orderBy: { orderIndex: 'asc' } },
        module: { include: { aiConfiguration: true } },
      },
    })

    if (!page) {
      throw new NotFoundException(`Page with id ${data.pageId} not found`)
    }

    if (page.blocks.length === 0) {
      throw new BadRequestException('Page has no blocks')
    }

    if (
      data.targetBlockIndex !== undefined &&
      data.targetBlockIndex >= page.blocks.length
    ) {
      throw new BadRequestException(
        `Target block index ${data.targetBlockIndex} is out of range (page has ${page.blocks.length} blocks)`,
      )
    }

    const existingBlocks = page.blocks.map((b) => ({
      type: b.type,
      content: this.parseJsonField<AiContent>(b.content),
    }))

    const config = {
      audience: page.module.aiConfiguration!.audience,
      language: page.module.aiConfiguration!.language,
      targetLevel: page.module.aiConfiguration!.targetLevel,
      tone: page.module.aiConfiguration!.tone,
    }

    const prompt = expandContentPrompt({
      existingBlocks,
      instruction: data.instruction,
      insertPosition: data.insertPosition as 'before' | 'after' | 'replace',
      targetBlockIndex: data.targetBlockIndex,
      config: {
        language: config.language,
        targetLevel: config.targetLevel,
        audience: config.audience,
        tone: config.tone,
      },
    })

    const aiResponse =
      await this.openAiService.getResponse<ExpandedContentDto>(prompt)

    return aiResponse.content
  }

  async extractPageConcepts(
    data: ExtractConceptsDto,
  ): Promise<PageConceptsExtractedDto> {
    this.logger.log('Extracting page concepts')
    const page = await this.dbService.page.findUnique({
      where: { id: data.pageId },
      include: { blocks: true, module: { include: { aiConfiguration: true } } },
    })

    if (!page) {
      throw new NotFoundException(`Page with id ${data.pageId} not found`)
    }

    if (page.blocks.length === 0) {
      throw new BadRequestException('Page has no blocks')
    }

    const prompt = extractPageConceptsPrompt({
      blocks: page.blocks
        .filter((b) => b.type === BlockType.TEXT)
        .map((b) => ({
          markdown: this.parseJsonField<{ markdown: string }>(b.content)
            .markdown,
        })),
      config: {
        language: page.module.aiConfiguration!.language,
      },
    })

    const aiResponse =
      await this.openAiService.getResponse<PageConceptsExtractedDto>(prompt)

    return aiResponse.content
  }

  async generateImage(prompt: string) {
    this.logger.log('Generating image')
    const image = await this.openAiService.generateImage(prompt)

    return image
  }

  async generateActivity(
    data: GenerateActivityDto,
  ): Promise<AiGeneratedActivity> {
    this.logger.log('Generating activity')

    const page = await this.dbService.page.findUnique({
      where: { id: data.pageId },
      include: { blocks: true, module: { include: { aiConfiguration: true } } },
    })

    if (!page) {
      throw new NotFoundException(`Page with id ${data.pageId} not found`)
    }

    if (page.blocks.length === 0) {
      throw new BadRequestException('Page has no blocks')
    }

    const blocks = page.blocks
      .filter((b) => b.type === BlockType.TEXT || b.type === BlockType.CODE)
      .map((b) => ({
        type: b.type,
        content: this.parseJsonField<AiTextBlock | AiCodeBlock>(b.content),
      }))

    if (blocks.length === 0) {
      throw new BadRequestException(
        'No eligible TEXT/CODE blocks found for activity generation',
      )
    }

    const language =
      data.language ?? page.module.aiConfiguration?.language ?? 'es'

    const prompt = generateActivityPrompt({
      type: data.type,
      blocks,
      config: {
        language,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        difficulty: (data.difficulty as any) ?? 3,
      },
      instructions: data.instructions,
    })

    const aiResponse =
      await this.openAiService.getResponse<AiGeneratedActivity>(prompt)

    return aiResponse.content
  }

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
    const topK = data.topK ?? 10
    const minSimilarity = data.minSimilarity ?? 0.5
    const similarRows = await this.pageRelationsService.findSimilarPages({
      embeddingLiteral,
      moduleId: page.moduleId,
      originPageId: data.pageId,
      topK,
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
      content: this.parseJsonField<AiContent>(b.content),
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

    return aiResponse.content
  }
}
