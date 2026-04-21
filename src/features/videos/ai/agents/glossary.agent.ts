import { Injectable } from '@nestjs/common'
import { BlockType } from 'src/core/database/generated/client'
import { PromptLoaderService } from '../config/prompt-loader.service'
import { GenerationResult } from '../interfaces/generation-result.interface'
import { glossarySchema } from '../schemas/glossary.schema'
import { glossaryLenientSchema } from '../schemas/glossary-lenient.schema'
import { normalizeGlossary } from '../normalizers/glossary.normalizer'
import { BaseContentAgent } from './base-content.agent'

@Injectable()
export class GlossaryAgent extends BaseContentAgent {
  readonly blockType = BlockType.GLOSSARY
  readonly taskName = 'glossary_task' as const
  readonly schema = glossarySchema
  readonly lenientSchema = glossaryLenientSchema

  constructor(promptLoader: PromptLoaderService) {
    super(promptLoader)
  }

  protected normalize(data: unknown): unknown {
    return normalizeGlossary(data)
  }

  assignTo(result: GenerationResult, data: unknown): void {
    result.glossary = data as GenerationResult['glossary']
  }
}
