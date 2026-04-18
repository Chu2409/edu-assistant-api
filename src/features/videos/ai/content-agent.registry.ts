import { HttpStatus, Injectable } from '@nestjs/common'
import { BlockType } from 'src/core/database/generated/client'
import { BusinessException } from 'src/shared/exceptions/business.exception'
import { BaseContentAgent } from './agents/base-content.agent'
import { SummaryAgent } from './agents/summary.agent'
import { FlashcardsAgent } from './agents/flashcards.agent'
import { QuizAgent } from './agents/quiz.agent'
import { GlossaryAgent } from './agents/glossary.agent'

@Injectable()
export class ContentAgentRegistry {
  private readonly registry: Map<BlockType, BaseContentAgent>

  constructor(
    summary: SummaryAgent,
    flashcards: FlashcardsAgent,
    quiz: QuizAgent,
    glossary: GlossaryAgent,
  ) {
    this.registry = new Map<BlockType, BaseContentAgent>([
      [BlockType.SUMMARY, summary],
      [BlockType.FLASHCARDS, flashcards],
      [BlockType.QUIZ, quiz],
      [BlockType.GLOSSARY, glossary],
    ])
  }

  get(blockType: BlockType): BaseContentAgent {
    const agent = this.registry.get(blockType)
    if (!agent) {
      throw new BusinessException(
        `No content agent registered for BlockType: ${blockType}`,
        HttpStatus.BAD_REQUEST,
      )
    }
    return agent
  }

  getSupportedTypes(): BlockType[] {
    return [...this.registry.keys()]
  }
}
