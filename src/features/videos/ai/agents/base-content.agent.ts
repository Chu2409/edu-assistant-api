import { Logger } from '@nestjs/common'
import { z } from 'zod'
import { generateText, LanguageModel, NoObjectGeneratedError, Output } from 'ai'
import { BlockType } from 'src/core/database/generated/client'
import { PromptLoaderService } from '../config/prompt-loader.service'
import { TaskName } from '../config/task-name.type'
import { GenerationInput } from '../interfaces/generation-input.interface'
import { GenerationResult } from '../interfaces/generation-result.interface'
import { AgentExecutionResult } from '../interfaces/agent-execution-result.interface'
import { ProviderOptionsBuilder } from '../video-ai-provider.service'

type GenerateTextProviderOptions = Parameters<
  typeof generateText
>[0]['providerOptions']

const NOOP_PROVIDER_OPTIONS: ProviderOptionsBuilder = () => undefined

export abstract class BaseContentAgent {
  protected readonly logger = new Logger(this.constructor.name)

  abstract readonly blockType: BlockType
  abstract readonly taskName: TaskName
  abstract readonly schema: z.ZodType
  readonly lenientSchema?: z.ZodType
  protected normalize?(data: unknown): unknown

  constructor(protected readonly promptLoader: PromptLoaderService) {}

  async execute(
    model: LanguageModel,
    input: GenerationInput,
    timeout: number,
    buildProviderOptions: ProviderOptionsBuilder = NOOP_PROVIDER_OPTIONS,
  ): Promise<AgentExecutionResult> {
    const prompt = this.promptLoader.getPrompt(this.taskName, input)
    const temperature = this.promptLoader.getTemperature(this.taskName)
    const maxOutputTokens = this.promptLoader.getMaxTokens(this.taskName)

    this.logger.debug(
      `Calling AI: task=${this.taskName} modelId=${String((model as { modelId?: string }).modelId ?? 'unknown')}`,
    )

    let strictInputTokens = 0
    let strictOutputTokens = 0

    try {
      const result = await generateText({
        model,
        output: Output.object({ schema: this.schema }),
        prompt,
        temperature,
        maxOutputTokens,
        abortSignal: AbortSignal.timeout(timeout),
        providerOptions: buildProviderOptions(
          this.schema,
        ) as GenerateTextProviderOptions,
      })

      strictInputTokens = result.usage.inputTokens ?? 0
      strictOutputTokens = result.usage.outputTokens ?? 0

      this.logger.debug(
        `AI response (strict): task=${this.taskName} finishReason=${result.finishReason} hasOutput=${!!result.output}`,
      )

      return {
        data: result.output,
        inputTokens: strictInputTokens,
        outputTokens: strictOutputTokens,
        needsReview: false,
      }
    } catch (error) {
      if (!this.canFallback(error)) throw error

      this.logger.warn(
        `Strict schema failed for task=${this.taskName}, attempting lenient fallback: ${error instanceof Error ? error.message : String(error)}`,
      )

      return this.executeLenient(
        model,
        prompt,
        temperature,
        maxOutputTokens,
        timeout,
        strictInputTokens,
        strictOutputTokens,
        error,
        buildProviderOptions,
      )
    }
  }

  private canFallback(error: unknown): boolean {
    if (!this.lenientSchema || !this.normalize) return false
    return NoObjectGeneratedError.isInstance(error)
  }

  private async executeLenient(
    model: LanguageModel,
    prompt: string,
    temperature: number,
    maxOutputTokens: number,
    timeout: number,
    strictInputTokens: number,
    strictOutputTokens: number,
    originalError: unknown,
    buildProviderOptions: ProviderOptionsBuilder,
  ): Promise<AgentExecutionResult> {
    const lenientSchema = this.lenientSchema!
    const normalize = this.normalize!.bind(this)

    const result = await generateText({
      model,
      output: Output.object({ schema: lenientSchema }),
      prompt,
      temperature,
      maxOutputTokens,
      abortSignal: AbortSignal.timeout(timeout),
      providerOptions: buildProviderOptions(
        lenientSchema,
      ) as GenerateTextProviderOptions,
    })

    this.logger.debug(
      `AI response (lenient): task=${this.taskName} finishReason=${result.finishReason} hasOutput=${!!result.output}`,
    )

    const normalized = normalize(result.output)
    const lenientInputTokens = result.usage.inputTokens ?? 0
    const lenientOutputTokens = result.usage.outputTokens ?? 0

    if (normalized === null) {
      this.logger.warn(
        `Lenient normalization returned null for task=${this.taskName} — treating as failure`,
      )
      throw originalError
    }

    return {
      data: normalized,
      inputTokens: strictInputTokens + lenientInputTokens,
      outputTokens: strictOutputTokens + lenientOutputTokens,
      needsReview: true,
    }
  }

  abstract assignTo(result: GenerationResult, data: unknown): void
}
