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

    const lo = await this.dbService.learningObject.findUnique({
      where: { id: data.learningObjectId },
      include: { blocks: true, module: { include: { aiConfiguration: true } } },
    })

    if (!lo) {
      throw new NotFoundException(
        `Learning Object with id ${data.learningObjectId} not found`,
      )
    }

    if (lo.blocks.length === 0) {
      throw new BadRequestException('Learning Object has no blocks')
    }

    const blocks = lo.blocks
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
      data.language ?? lo.module.aiConfiguration?.language ?? 'es'

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
