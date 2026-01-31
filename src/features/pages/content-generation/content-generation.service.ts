import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { OpenaiService } from 'src/providers/ai/openai.service'
import {
  generatePageContentPrompt,
  GeneratePageContentPrompt,
} from './prompts/generate-page-content.prompt'
import {
  extractPageConceptsPrompt,
  ExtractPageConceptsPrompt,
} from './prompts/extract-page-concepts.prompt'
import { PageConceptsExtractedDto } from './dtos/res/page-concepts-extracted.dto'
import { GeneratedPageContent } from './dtos/res/generated-page-content.dto'
import { AiResponseDto } from 'src/providers/ai/dtos/ai-response.interface'
import { GenerateContentDto } from './dtos/req/generate-content.dto'

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
    const content =
      await this.openAiService.getResponse<GeneratedPageContent>(prompt)

    return content
  }

  async extractPageConcepts(
    data: ExtractPageConceptsPrompt,
  ): Promise<PageConceptsExtractedDto> {
    this.logger.log('Extracting page concepts')
    const prompt = extractPageConceptsPrompt(data)

    const content =
      await this.openAiService.getResponse<PageConceptsExtractedDto>(prompt)

    return content.content
  }
}
