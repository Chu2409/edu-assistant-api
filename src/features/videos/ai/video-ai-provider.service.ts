import { Injectable, HttpStatus } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createGroq } from '@ai-sdk/groq'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOllama } from 'ollama-ai-provider'
import { type generateObject } from 'ai'
import { BusinessException } from 'src/shared/exceptions/business.exception'
import { IConfig } from 'src/core/config/types'

type AiModel = Parameters<typeof generateObject>[0]['model']
type ProviderFactory = (modelName: string) => AiModel

@Injectable()
export class VideoAiProviderService {
  private readonly providerMap: Map<string, ProviderFactory>

  constructor(private readonly configService: ConfigService) {
    this.providerMap = new Map<string, ProviderFactory>([
      [
        'groq',
        (model) =>
          createGroq({
            apiKey: this.configService.get<string>('APP.GROQ_API_KEY'),
          })(model),
      ],
      [
        'openai',
        (model) =>
          createOpenAI({
            apiKey: this.configService.get<string>('APP.OPENAI_API_KEY'),
          })(model),
      ],
      [
        'google',
        (model) =>
          createGoogleGenerativeAI({
            apiKey: this.configService.get<string>(
              'APP.GOOGLE_GENERATIVE_AI_API_KEY',
            ),
          })(model),
      ],
      [
        'ollama',
        (model) =>
          createOllama({
            baseURL: this.configService.get<string>('APP.OLLAMA_BASE_URL'),
          })(model) as unknown as AiModel,
      ],
    ])
  }

  getModel(): AiModel {
    const provider = this.configService.get<IConfig['VIDEO_AI_PROVIDER']>(
      'APP.VIDEO_AI_PROVIDER',
    )!
    const modelName =
      this.configService.get<IConfig['VIDEO_AI_MODEL']>('APP.VIDEO_AI_MODEL')!

    const factory = this.providerMap.get(provider)
    if (!factory) {
      throw new BusinessException(
        `Unknown AI provider: ${provider}`,
        HttpStatus.BAD_REQUEST,
      )
    }

    return factory(modelName)
  }

  getProviderName(): string {
    return this.configService.get<string>('APP.VIDEO_AI_PROVIDER')!
  }

  getModelName(): string {
    return this.configService.get<string>('APP.VIDEO_AI_MODEL')!
  }
}
