import { Injectable } from '@nestjs/common'
import { BlockType } from 'src/core/database/generated/client'
import { PromptLoaderService } from '../config/prompt-loader.service'
import { GenerationResult } from '../interfaces/generation-result.interface'
import { flashcardsSchema } from '../schemas/flashcards.schema'
import { flashcardsLenientSchema } from '../schemas/flashcards-lenient.schema'
import { normalizeFlashcards } from '../normalizers/flashcards.normalizer'
import { BaseContentAgent } from './base-content.agent'

@Injectable()
export class FlashcardsAgent extends BaseContentAgent {
  readonly blockType = BlockType.FLASHCARDS
  readonly taskName = 'flashcard_task' as const
  readonly schema = flashcardsSchema
  readonly lenientSchema = flashcardsLenientSchema

  constructor(promptLoader: PromptLoaderService) {
    super(promptLoader)
  }

  protected normalize(data: unknown): unknown {
    return normalizeFlashcards(data)
  }

  assignTo(result: GenerationResult, data: unknown): void {
    result.flashcards = data as GenerationResult['flashcards']
  }
}
