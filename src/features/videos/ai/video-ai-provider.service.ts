import { Injectable, HttpStatus } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createGroq } from '@ai-sdk/groq'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import {
  extractJsonMiddleware,
  wrapLanguageModel,
  type LanguageModel,
} from 'ai'
import { z } from 'zod'
import { BusinessException } from 'src/shared/exceptions/business.exception'
import { IConfig } from 'src/core/config/types'
import { extractJsonTransform } from './helpers/extract-json-transform'
import { reasoningContentFallbackMiddleware } from './helpers/reasoning-content-fallback.middleware'
import { loggingFetch } from './helpers/logging-fetch'

type ProviderFactory = (modelName: string) => LanguageModel

const NVIDIA_PROVIDER_KEY = 'nim'

export type ProviderOptionsBuilder = (
  schema: z.ZodType,
) => Record<string, Record<string, unknown>> | undefined

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
          }).chat(model),
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
        'nvidia',
        (model) =>
          wrapLanguageModel({
            model: createOpenAICompatible({
              name: 'nim',
              baseURL: this.configService.get<string>('APP.NVIDIA_BASE_URL')!,
              headers: {
                Authorization: `Bearer ${this.configService.get<string>('APP.NVIDIA_API_KEY')}`,
              },
              fetch: loggingFetch,
            }).chatModel(model),
            middleware: [
              extractJsonMiddleware({ transform: extractJsonTransform }),
              reasoningContentFallbackMiddleware,
            ],
          }),
      ],
      [
        'ollama',
        (model) =>
          wrapLanguageModel({
            model: createOpenAICompatible({
              name: 'ollama',
              baseURL: `${this.configService.get<string>('APP.OLLAMA_BASE_URL')}/v1`,
            }).chatModel(model),
            middleware: [
              extractJsonMiddleware({ transform: extractJsonTransform }),
              reasoningContentFallbackMiddleware,
            ],
          }),
      ],
    ])
  }

  getModel(): LanguageModel {
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

  buildStrictJsonOptions: ProviderOptionsBuilder = (schema) => {
    if (this.getProviderName() !== 'nvidia') return undefined

    const enableThinking = this.configService.get<boolean>(
      'APP.NVIDIA_ENABLE_THINKING',
    )

    return {
      [NVIDIA_PROVIDER_KEY]: {
        nvext: {
          guided_json: z.toJSONSchema(schema, { target: 'draft-7' }),
        },
        chat_template_kwargs: {
          enable_thinking: enableThinking,
        },
      },
    }
  }
}
