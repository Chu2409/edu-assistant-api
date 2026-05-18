import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { BusinessException } from 'src/shared/exceptions/business.exception'
import OpenAI from 'openai'
import { ZodSchema, ZodError } from 'zod'
import { CustomConfigService } from 'src/core/config/config.service'
import { PromptInput } from '../interfaces/prompt-input.interface'
import { AiResponseDto } from '../dtos/res/ai-response.dto'
import { parseJsonField } from '../helpers/utils'
import { AiConfigService } from './ai-config.service'
import {
  BASE_DELAY_MS,
  MAX_RETRIES,
  MAX_VALIDATION_RETRIES,
} from '../constants/configuration'
import { AiFormatValidationException } from '../exceptions/ai-format-validation.exception'

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
    schema?: ZodSchema<T>,
    previousResponseId?: string,
  ): Promise<AiResponseDto<T>> {
    return this.withRetry(async () => {
      const result = await this.callResponsesApi<T>(input, previousResponseId)

      if (schema) {
        return {
          ...result,
          content: this.validateWithRetry(result.content, schema),
        }
      }

      return result
    })
  }

  /**
   * Internal call to OpenAI Responses API (no validation)
   */
  private async callResponsesApi<T>(
    input: PromptInput[],
    previousResponseId?: string,
  ): Promise<AiResponseDto<T>> {
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
  }

  /**
   * Validate response against a Zod schema with retries.
   * If validation fails, re-calls OpenAI to get a corrected response.
   */
  private validateWithRetry<T>(content: T, schema: ZodSchema<T>): T {
    try {
      return schema.parse(content)
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ')

        this.logger.warn(
          `Validación de formato de IA fallida, reintentando... Errores: ${issues}`,
        )

        // Throw to trigger withRetry
        throw new AiFormatValidationException(issues)
      }
      throw error
    }
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
        throw new Error('OpenAI no retornó datos de imagen')
      }
      const b64Json = response.data[0].b64_json
      if (!b64Json) {
        throw new Error('OpenAI no retornó datos en formato base64')
      }
      return b64Json
    })
  }

  // --- Retry logic ---

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    const maxAttempts = MAX_RETRIES + MAX_VALIDATION_RETRIES
    let validationAttempts = 0

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (error) {
        const isValidationError = error instanceof AiFormatValidationException

        if (isValidationError) {
          validationAttempts++
          if (validationAttempts >= MAX_VALIDATION_RETRIES) {
            this.logger.error(
              `Validación de formato de IA fallida después de ${MAX_VALIDATION_RETRIES} intento(s)`,
            )
            throw new Error(
              'La respuesta de la IA no tiene el formato esperado después de múltiples intentos. Intenta generar de nuevo.',
            )
          }
          this.logger.warn(
            `Reintentando por formato inválido (intento ${validationAttempts}/${MAX_VALIDATION_RETRIES})...`,
          )
          continue // No delay for format retries
        }

        const apiAttempt = attempt - validationAttempts
        const isLastAttempt = apiAttempt >= MAX_RETRIES

        if (!this.isRetryable(error) || isLastAttempt) {
          this.handleError(error, apiAttempt)
        }

        const delay = BASE_DELAY_MS * Math.pow(2, apiAttempt - 1)
        this.logger.warn(
          `Solicitud a OpenAI fallida (intento ${apiAttempt}/${MAX_RETRIES}), reintentando en ${delay}ms...`,
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
        `Error de API OpenAI [${error.status}] después de ${attempt} intento(s): ${error.message}`,
      )

      if (error.status === 429) {
        throw new BusinessException(
          'El servicio de IA está temporalmente saturado. Intenta de nuevo en unos momentos.',
          HttpStatus.TOO_MANY_REQUESTS,
        )
      }

      if (error.status === 401 || error.status === 403) {
        throw new Error('Error de configuración del servicio de IA')
      }
    }

    this.logger.error('Error de OpenAI:', error)
    throw new Error('Error en la comunicación con OpenAI')
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private logUsage(model: string, usage: any): void {
    if (!usage) return
    this.logger.log(
      `Uso de OpenAI [${model}]: entrada=${usage.input_tokens ?? '?'}, salida=${usage.output_tokens ?? '?'}, total=${usage.total_tokens ?? '?'}`,
    )
  }
}
