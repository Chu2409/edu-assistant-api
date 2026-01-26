import { Injectable } from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { OpenaiService } from 'src/providers/ai/openai.service'
import {
  generatePageContentPrompt,
  GeneratePageContentPrompt,
} from './prompts/generate-page-content.prompt'
import { GeneratePageContentDto } from './dtos/res/generate-page-content.dto'

@Injectable()
export class ContentGenerationService {
  constructor(
    private readonly dbService: DBService,
    private readonly openAiService: OpenaiService,
  ) {}

  async generatePageContent(
    data: GeneratePageContentPrompt,
  ): Promise<GeneratePageContentDto> {
    const prompt = generatePageContentPrompt(data)
    // 3. MOCK: Llamar AIService.generateContent() (devuelve HTML fake)
    const content = await this.openAiService.getResponse(prompt)

    return content!
  }
}
