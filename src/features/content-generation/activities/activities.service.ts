import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { OpenaiService } from 'src/providers/ai/services/openai.service'
import { generateActivityPrompt } from './prompts/generate-activity.prompt'
import { GenerateActivityDto } from './dtos/req/generate-activity.dto'
import type { AiGeneratedActivity } from './interfaces/ai-generated-activity.interface'
import { BlockType } from 'src/core/database/generated/enums'
import type {
  AiTextBlock,
  AiCodeBlock,
} from '../shared/interfaces/ai-generated-content.interface'
import { parseJsonField } from 'src/providers/ai/helpers/utils'
import { validateAiResponse } from 'src/providers/ai/helpers/ai-response-validator'
import { aiGeneratedActivitySchema } from '../shared/schemas/ai-content.schema'

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name)

  constructor(
    private readonly dbService: DBService,
    private readonly openAiService: OpenaiService,
  ) {}

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
        content: parseJsonField<AiTextBlock | AiCodeBlock>(b.content),
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
        difficulty: (data.difficulty ?? 3) as 1 | 2 | 3 | 4 | 5,
      },
      instructions: data.instructions,
    })

    const aiResponse =
      await this.openAiService.getResponse<AiGeneratedActivity>(prompt)

    return validateAiResponse(
      aiResponse.content,
      aiGeneratedActivitySchema,
    ) as AiGeneratedActivity
  }
}
