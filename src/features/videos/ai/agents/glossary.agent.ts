import { Injectable } from '@nestjs/common'
import { BlockType } from 'src/core/database/generated/client'
import { PromptLoaderService } from '../config/prompt-loader.service'
import { GenerationResult } from '../interfaces/generation-result.interface'
import { glossarySchema } from '../schemas/glossary.schema'
import { BaseContentAgent } from './base-content.agent'

@Injectable()
export class GlossaryAgent extends BaseContentAgent {
  readonly blockType = BlockType.GLOSSARY
  readonly taskName = 'glossary_task' as const
  readonly schema = glossarySchema

  constructor(promptLoader: PromptLoaderService) {
    super(promptLoader)
  }

  assignTo(result: GenerationResult, data: unknown): void {
    result.glossary = data as GenerationResult['glossary']
  }
}
