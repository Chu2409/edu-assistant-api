import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { BlockType } from 'src/core/database/generated/client'
import { IConfig } from 'src/core/config/types'
import { VideoAiProviderService } from './video-ai-provider.service'
import { ContentAgentRegistry } from './content-agent.registry'
import { GenerationInput } from './interfaces/generation-input.interface'
import { GenerationResult } from './interfaces/generation-result.interface'

@Injectable()
export class VideoContentGeneratorService {
  private readonly logger = new Logger(VideoContentGeneratorService.name)

  constructor(
    private readonly aiProvider: VideoAiProviderService,
    private readonly agentRegistry: ContentAgentRegistry,
    private readonly configService: ConfigService,
  ) {}

  generateAll(input: GenerationInput): Promise<GenerationResult> {
    return this.runAgents(this.agentRegistry.getSupportedTypes(), input)
  }

  regenerate(
    types: BlockType[],
    input: GenerationInput,
  ): Promise<GenerationResult> {
    return this.runAgents(types, input)
  }

  private async runAgents(
    types: BlockType[],
    input: GenerationInput,
  ): Promise<GenerationResult> {
    const model = this.aiProvider.getModel()
    const timeout = this.configService.get<IConfig['VIDEO_AI_REQUEST_TIMEOUT']>(
      'APP.VIDEO_AI_REQUEST_TIMEOUT',
    )!
    const agents = types.map((type) => this.agentRegistry.get(type))

    const settled = await Promise.allSettled(
      agents.map((agent) => agent.execute(model, input, timeout)),
    )

    const result: GenerationResult = {
      errors: [],
      needsReview: {},
      totalTokens: { input: 0, output: 0 },
      provider: this.aiProvider.getProviderName(),
      model: this.aiProvider.getModelName(),
    }

    for (let i = 0; i < settled.length; i++) {
      const entry = settled[i]
      const agent = agents[i]

      if (entry.status === 'fulfilled') {
        agent.assignTo(result, entry.value.data)
        result.needsReview[agent.blockType] = entry.value.needsReview
        result.totalTokens.input += entry.value.inputTokens
        result.totalTokens.output += entry.value.outputTokens

        if (entry.value.needsReview) {
          this.logger.warn(
            `Generation for ${agent.blockType} flagged needsReview=true (lenient fallback)`,
          )
        }
      } else {
        const errorMessage =
          entry.reason instanceof Error
            ? entry.reason.message
            : String(entry.reason)
        this.logger.error(
          `Generation failed for ${agent.blockType}: ${errorMessage}`,
        )
        result.errors.push({ type: agent.blockType, error: errorMessage })
      }
    }

    return result
  }
}
