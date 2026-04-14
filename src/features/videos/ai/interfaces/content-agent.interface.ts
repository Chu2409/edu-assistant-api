import { z } from 'zod'
import { BlockType } from 'src/core/database/generated/client'

export interface ContentAgent {
  blockType: BlockType
  taskName: 'summary_task' | 'flashcard_task' | 'quiz_task' | 'glossary_task'
  schema: z.ZodType
}
