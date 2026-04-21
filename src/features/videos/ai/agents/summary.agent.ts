import { Injectable } from '@nestjs/common'
import { BlockType } from 'src/core/database/generated/client'
import { PromptLoaderService } from '../config/prompt-loader.service'
import { GenerationResult } from '../interfaces/generation-result.interface'
import { summarySchema } from '../schemas/summary.schema'
import { summaryLenientSchema } from '../schemas/summary-lenient.schema'
import { normalizeSummary } from '../normalizers/summary.normalizer'
import { BaseContentAgent } from './base-content.agent'

@Injectable()
export class SummaryAgent extends BaseContentAgent {
  readonly blockType = BlockType.SUMMARY
  readonly taskName = 'summary_task' as const
  readonly schema = summarySchema
  readonly lenientSchema = summaryLenientSchema

  constructor(promptLoader: PromptLoaderService) {
    super(promptLoader)
  }

  protected normalize(data: unknown): unknown {
    return normalizeSummary(data)
  }

  assignTo(result: GenerationResult, data: unknown): void {
    result.summary = data as GenerationResult['summary']
  }
}
