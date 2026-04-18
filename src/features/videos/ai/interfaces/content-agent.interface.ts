import { z } from 'zod'
import { BlockType } from 'src/core/database/generated/client'
import { TaskName } from '../config/task-name.type'

export interface ContentAgent {
  blockType: BlockType
  taskName: TaskName
  schema: z.ZodType
}
