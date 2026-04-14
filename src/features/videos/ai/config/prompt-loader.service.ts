import { Injectable } from '@nestjs/common'
import { readFileSync } from 'fs'
import { join } from 'path'
import * as yaml from 'js-yaml'
import { GenerationInput } from '../interfaces/generation.interface'
import {
  MAX_FLASHCARDS,
  MAX_QUIZ_QUESTIONS,
} from '../../constants/video.constants'

interface TaskConfig {
  temperature: number
  max_tokens: number
  description: string
}

type TaskName =
  | 'summary_task'
  | 'flashcard_task'
  | 'quiz_task'
  | 'glossary_task'

@Injectable()
export class PromptLoaderService {
  private readonly tasks: Record<TaskName, TaskConfig>

  constructor() {
    const filePath = join(
      process.cwd(),
      'dist',
      'features',
      'videos',
      'ai',
      'config',
      'tasks.yaml',
    )
    const raw = readFileSync(filePath, 'utf-8')
    this.tasks = yaml.load(raw) as Record<TaskName, TaskConfig>
  }

  getPrompt(taskName: TaskName, input: GenerationInput): string {
    const task = this.tasks[taskName]
    const titleContext = `The video title is: "${input.videoTitle}".`
    const languageInstruction =
      input.language === 'auto'
        ? 'Respond in the same language as the transcription.'
        : `Respond entirely in ${input.language}.`

    return task.description
      .replace(/{transcription}/g, input.transcription)
      .replace(/{title_context}/g, titleContext)
      .replace(/{language_instruction}/g, languageInstruction)
      .replace(/{max_cards}/g, String(MAX_FLASHCARDS))
      .replace(/{max_questions}/g, String(MAX_QUIZ_QUESTIONS))
  }

  getTemperature(taskName: TaskName): number {
    return this.tasks[taskName].temperature
  }

  getMaxTokens(taskName: TaskName): number {
    return this.tasks[taskName].max_tokens
  }
}
