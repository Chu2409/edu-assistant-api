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
import { AiResponseDto } from 'src/providers/ai/dtos/ai-response.interface'
import { GenerateContentDto } from './dtos/req/generate-content.dto'
import { RegenerateContentDto } from './dtos/req/regenarte-content.dto'
import { regeneratePageContentPrompt } from './prompts/regenerate-page-content.prompt'
import { ExtractConceptsDto } from './dtos/req/extract-concepts.dto'
import { BlockType } from 'src/core/database/generated/enums'
import { GenerateActivityDto } from './dtos/req/generate-activity.dto'
import { generateActivityPrompt } from './prompts/generate-activity.prompt'
import type { AiGeneratedActivity } from './interfaces/ai-generated-activity.interface'

@Injectable()
export class ContentGenerationService {
  private readonly logger = new Logger(ContentGenerationService.name)
  constructor(
    private readonly dbService: DBService,
    private readonly openAiService: OpenaiService,
  ) {}

  async generatePageContent(
    data: GenerateContentDto,
  ): Promise<AiResponseDto<GeneratedPageContent>> {
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
        learningObjectives: page.module.aiConfiguration!.learningObjectives,
      },
    })
    const aiResponse =
      await this.openAiService.getResponse<GeneratedPageContent>(prompt)

    return aiResponse
  }

  async regeneratePageContent(
    data: RegenerateContentDto,
  ): Promise<AiResponseDto<GeneratedPageContent>> {
    this.logger.log('Regenerating page content')

    const page = await this.dbService.page.findUnique({
      where: { id: data.pageId },
      include: { blocks: true, module: { include: { aiConfiguration: true } } },
    })

    if (!page) {
      throw new NotFoundException(`Page with id ${data.pageId} not found`)
    }

    const prompt = regeneratePageContentPrompt({
      title: page.title,
      instructions: data.instructions,
      blocks: page.blocks.map((b) => ({
        type: b.type,
        content: JSON.parse(b.content as string),
      })),
      config: {
        audience: data.audience ?? page.module.aiConfiguration!.audience,
        contentLength:
          data.contentLength ?? page.module.aiConfiguration!.contentLength,
        language: data.language ?? page.module.aiConfiguration!.language,
        targetLevel:
          data.targetLevel ?? page.module.aiConfiguration!.targetLevel,
        tone: data.tone ?? page.module.aiConfiguration!.tone,
        learningObjectives: page.module.aiConfiguration!.learningObjectives,
      },
    })

    const aiResponse =
      await this.openAiService.getResponse<GeneratedPageContent>(prompt)

    return aiResponse
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
        .map((b) => ({ markdown: JSON.parse(b.content as string).markdown })),
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

    console.log('0')

    const blocks = page.blocks
      .filter((b) => b.type === BlockType.TEXT || b.type === BlockType.CODE)
      .map((b) => ({
        type: b.type,
        content: JSON.parse(b.content as string),
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
        difficulty: (data.difficulty as any) ?? 3,
      },
      instructions: data.instructions,
    })

    const aiResponse =
      await this.openAiService.getResponse<AiGeneratedActivity>(prompt)

    return aiResponse.content
  }
}
