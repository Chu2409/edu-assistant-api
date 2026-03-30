import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import OpenAI from 'openai'
import { CustomConfigService } from 'src/core/config/config.service'
import { PromptInput } from '../interfaces/prompt-input.interface'
import { AiResponseDto } from '../dtos/res/ai-response.dto'
import { parseJsonField } from '../helpers/utils'
import { AiConfigService } from './ai-config.service'
import { BASE_DELAY_MS, MAX_RETRIES } from '../constants/configuration'

@Injectable()
export class OpenaiService implements OnModuleInit {
  private openai: OpenAI
  private readonly logger = new Logger(OpenaiService.name)

  constructor(
    private customConfigService: CustomConfigService,
    private aiConfigurationService: AiConfigService,
  ) {}

  onModuleInit() {
    this.openai = new OpenAI({
      apiKey: this.customConfigService.env.OPENAI_API_KEY,
    })
  }

  // 1. RESPONSES API
  async getResponse<T>(
    input: PromptInput[],
    previousResponseId?: string,
  ): Promise<AiResponseDto<T>> {
    return this.withRetry(async () => {
      const config = this.aiConfigurationService.getModelConfig()
      const response = await this.openai.responses.create({
        model: config.responses,
        input,
        previous_response_id: previousResponseId,
      })

      this.logUsage(config.responses, response.usage)

      const content = parseJsonField<T>(response.output_text)

      return {
        content,
        responseId: response.id,
      }
    })
  }

  async getMarkdownResponse(
    input: PromptInput[],
    previousResponseId?: string,
  ): Promise<{ content: string; responseId: string }> {
    return this.withRetry(async () => {
      const config = this.aiConfigurationService.getModelConfig()
      const response = await this.openai.responses.create({
        model: config.responses,
        input,
        previous_response_id: previousResponseId,
      })

      this.logUsage(config.responses, response.usage)

      return {
        content: response.output_text,
        responseId: response.id,
      }
    })
  }

  // 2. EMBEDDINGS API
  async getEmbedding(text: string) {
    return this.withRetry(async () => {
      const config = this.aiConfigurationService.getModelConfig()
      const response = await this.openai.embeddings.create({
        model: config.embeddings,
        input: text,
      })
      return response.data[0].embedding
    })
  }

  // 3. IMAGES API (DALL-E)
  async generateImage(prompt: string): Promise<string> {
    return this.withRetry(async () => {
      const config = this.aiConfigurationService.getModelConfig()
      const response = await this.openai.images.generate({
        model: config.images,
        prompt,
        n: 1,
        size: 'auto',
        quality: 'auto',
      })
      if (!response.data || response.data.length === 0) {
        throw new Error('No image data returned from OpenAI')
      }
      const b64Json = response.data[0].b64_json
      if (!b64Json) {
        throw new Error('No base64 JSON data returned from OpenAI')
      }
      return b64Json
    })
  }

  // --- Retry logic ---

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await fn()
      } catch (error) {
        const isLastAttempt = attempt === MAX_RETRIES

        if (!this.isRetryable(error) || isLastAttempt) {
          this.handleError(error, attempt)
        }

        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1)
        this.logger.warn(
          `OpenAI request failed (attempt ${attempt}/${MAX_RETRIES}), retrying in ${delay}ms...`,
        )
        await this.delay(delay)
      }
    }

    // Unreachable, but TypeScript needs it
    throw new Error('Error en la comunicación con OpenAI')
  }

  private isRetryable(error: unknown): boolean {
    if (error instanceof OpenAI.APIError) {
      const retryableStatuses = [429, 500, 502, 503, 504]
      return retryableStatuses.includes(error.status)
    }

    // Network errors (timeout, connection reset)
    if (error instanceof Error) {
      const networkErrors = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED']
      return networkErrors.some((code) => error.message.includes(code))
    }

    return false
  }

  private handleError(error: unknown, attempt: number): never {
    if (error instanceof OpenAI.APIError) {
      this.logger.error(
        `OpenAI API Error [${error.status}] after ${attempt} attempt(s): ${error.message}`,
      )

      if (error.status === 429) {
        throw new Error(
          'El servicio de IA está temporalmente saturado. Intenta de nuevo en unos momentos.',
        )
      }

      if (error.status === 401 || error.status === 403) {
        throw new Error('Error de configuración del servicio de IA')
      }
    }

    this.logger.error('OpenAI Error:', error)
    throw new Error('Error en la comunicación con OpenAI')
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private logUsage(model: string, usage: any): void {
    if (!usage) return
    this.logger.log(
      `OpenAI usage [${model}]: input=${usage.input_tokens ?? '?'}, output=${usage.output_tokens ?? '?'}, total=${usage.total_tokens ?? '?'}`,
    )
  }
}
