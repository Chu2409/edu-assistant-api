import { Logger } from '@nestjs/common'
import { z } from 'zod'
import { generateText, LanguageModel, Output } from 'ai'
import { BlockType } from 'src/core/database/generated/client'
import { PromptLoaderService } from '../config/prompt-loader.service'
import { TaskName } from '../config/task-name.type'
import { GenerationInput } from '../interfaces/generation-input.interface'
import { GenerationResult } from '../interfaces/generation-result.interface'
import { AgentExecutionResult } from '../interfaces/agent-execution-result.interface'

export abstract class BaseContentAgent {
  protected readonly logger = new Logger(this.constructor.name)

  abstract readonly blockType: BlockType
  abstract readonly taskName: TaskName
  abstract readonly schema: z.ZodType

  constructor(protected readonly promptLoader: PromptLoaderService) {}

  async execute(
    model: LanguageModel,
    input: GenerationInput,
    timeout: number,
  ): Promise<AgentExecutionResult> {
    const prompt = this.promptLoader.getPrompt(this.taskName, input)
    const temperature = this.promptLoader.getTemperature(this.taskName)
    const maxOutputTokens = this.promptLoader.getMaxTokens(this.taskName)

    this.logger.debug(
      `Calling AI: task=${this.taskName} modelId=${String((model as { modelId?: string }).modelId ?? 'unknown')}`,
    )

    const result = await generateText({
      model,
      output: Output.object({ schema: this.schema }),
      prompt,
      temperature,
      maxOutputTokens,
      abortSignal: AbortSignal.timeout(timeout),
    })

    this.logger.debug(
      `AI response: task=${this.taskName} finishReason=${result.finishReason} hasOutput=${!!result.output}`,
    )

    return {
      data: result.output,
      inputTokens: result.usage.inputTokens ?? 0,
      outputTokens: result.usage.outputTokens ?? 0,
    }
  }

  abstract assignTo(result: GenerationResult, data: unknown): void
}
