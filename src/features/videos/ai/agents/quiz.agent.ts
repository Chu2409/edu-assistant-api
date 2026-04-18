import { Injectable } from '@nestjs/common'
import { BlockType } from 'src/core/database/generated/client'
import { PromptLoaderService } from '../config/prompt-loader.service'
import { GenerationResult } from '../interfaces/generation-result.interface'
import { quizSchema } from '../schemas/quiz.schema'
import { quizLenientSchema } from '../schemas/quiz-lenient.schema'
import { normalizeQuiz } from '../normalizers/quiz.normalizer'
import { BaseContentAgent } from './base-content.agent'

@Injectable()
export class QuizAgent extends BaseContentAgent {
  readonly blockType = BlockType.QUIZ
  readonly taskName = 'quiz_task' as const
  readonly schema = quizSchema
  readonly lenientSchema = quizLenientSchema

  constructor(promptLoader: PromptLoaderService) {
    super(promptLoader)
  }

  protected normalize(data: unknown): unknown {
    return normalizeQuiz(data)
  }

  assignTo(result: GenerationResult, data: unknown): void {
    result.quiz = data as GenerationResult['quiz']
  }
}
