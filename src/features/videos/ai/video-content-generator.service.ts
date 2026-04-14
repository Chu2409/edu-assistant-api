import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { generateObject } from 'ai'
import { BlockType } from 'src/core/database/generated/client'
import { IConfig } from 'src/core/config/types'
import { VideoAiProviderService } from './video-ai-provider.service'
import { PromptLoaderService } from './config/prompt-loader.service'
import { ContentAgentFactory } from './content-agent.factory'
import { ContentAgent } from './interfaces/content-agent.interface'
import {
  GenerationInput,
  GenerationResult,
} from './interfaces/generation.interface'

@Injectable()
export class VideoContentGeneratorService {
  private readonly logger = new Logger(VideoContentGeneratorService.name)

  constructor(
    private readonly aiProvider: VideoAiProviderService,
    private readonly promptLoader: PromptLoaderService,
    private readonly agentFactory: ContentAgentFactory,
    private readonly configService: ConfigService,
  ) {}

  async generateAll(input: GenerationInput): Promise<GenerationResult> {
    const types = this.agentFactory.getSupportedTypes()
    return this.runAgents(types, input)
  }

  async regenerate(
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
    const agents = types.map((type) => this.agentFactory.create(type))

    const settled = await Promise.allSettled(
      agents.map((agent) => this.executeAgent(agent, model, input, timeout)),
    )

    const result: GenerationResult = {
      errors: [],
      totalTokens: { input: 0, output: 0 },
      provider: this.aiProvider.getProviderName(),
      model: this.aiProvider.getModelName(),
    }

    for (let i = 0; i < settled.length; i++) {
      const entry = settled[i]
      const agent = agents[i]

      if (entry.status === 'fulfilled') {
        this.assignResult(result, agent.blockType, entry.value.data)
        result.totalTokens.input += entry.value.tokens.inputTokens ?? 0
        result.totalTokens.output += entry.value.tokens.outputTokens ?? 0
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

  private async executeAgent(
    agent: ContentAgent,
    model: Parameters<typeof generateObject>[0]['model'],
    input: GenerationInput,
    timeout: number,
  ) {
    const prompt = this.promptLoader.getPrompt(agent.taskName, input)
    const temperature = this.promptLoader.getTemperature(agent.taskName)
    const maxOutputTokens = this.promptLoader.getMaxTokens(agent.taskName)

    const result = await generateObject({
      model,
      schema: agent.schema,
      prompt,
      temperature,
      maxOutputTokens,
      abortSignal: AbortSignal.timeout(timeout),
    })

    return { data: result.object, tokens: result.usage }
  }

  private assignResult(
    result: GenerationResult,
    blockType: BlockType,
    data: unknown,
  ): void {
    const keyMap = new Map<BlockType, keyof GenerationResult>([
      [BlockType.SUMMARY, 'summary'],
      [BlockType.FLASHCARDS, 'flashcards'],
      [BlockType.QUIZ, 'quiz'],
      [BlockType.GLOSSARY, 'glossary'],
    ])

    const key = keyMap.get(blockType)
    if (key) {
      ;(result as unknown as Record<string, unknown>)[key] = data
    }
  }
}
