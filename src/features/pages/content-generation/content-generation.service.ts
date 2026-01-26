import { Injectable } from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { OpenaiService } from 'src/providers/ai/openai.service'
import {
  generatePageContentPrompt,
  GeneratePageContentPrompt,
} from './prompts/generate-page-content.prompt'
import { PageContentGeneratedDto } from './dtos/res/page-content-generated.dto'
import {
  extractPageConceptsPrompt,
  ExtractPageConceptsPrompt,
} from './prompts/extract-page-concepts.prompt'
import { PageConceptsExtractedDto } from './dtos/res/page-concepts-extracted.dto'

@Injectable()
export class ContentGenerationService {
  constructor(
    private readonly dbService: DBService,
    private readonly openAiService: OpenaiService,
  ) {}

  async generatePageContent(
    data: GeneratePageContentPrompt,
  ): Promise<PageContentGeneratedDto> {
    const prompt = generatePageContentPrompt(data)
    const content = await this.openAiService.getResponse(prompt)

    return content
  }

  async extractPageConcepts(
    data: ExtractPageConceptsPrompt,
  ): Promise<PageConceptsExtractedDto> {
    const prompt = extractPageConceptsPrompt(data)

    const content = await this.openAiService.getResponse(prompt)

    return content.content
  }
}
