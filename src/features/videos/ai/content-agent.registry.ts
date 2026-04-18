import { Injectable, HttpStatus } from '@nestjs/common'
import { BlockType } from 'src/core/database/generated/client'
import { BusinessException } from 'src/shared/exceptions/business.exception'
import { ContentAgent } from './interfaces/content-agent.interface'
import { summarySchema } from './schemas/summary.schema'
import { flashcardsSchema } from './schemas/flashcards.schema'
import { quizSchema } from './schemas/quiz.schema'
import { glossarySchema } from './schemas/glossary.schema'

@Injectable()
export class ContentAgentRegistry {
  private readonly registry = new Map<BlockType, ContentAgent>([
    [
      BlockType.SUMMARY,
      {
        blockType: BlockType.SUMMARY,
        taskName: 'summary_task',
        schema: summarySchema,
      },
    ],
    [
      BlockType.FLASHCARDS,
      {
        blockType: BlockType.FLASHCARDS,
        taskName: 'flashcard_task',
        schema: flashcardsSchema,
      },
    ],
    [
      BlockType.QUIZ,
      { blockType: BlockType.QUIZ, taskName: 'quiz_task', schema: quizSchema },
    ],
    [
      BlockType.GLOSSARY,
      {
        blockType: BlockType.GLOSSARY,
        taskName: 'glossary_task',
        schema: glossarySchema,
      },
    ],
  ])

  get(blockType: BlockType): ContentAgent {
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
