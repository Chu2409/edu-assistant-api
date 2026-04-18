import { BlockType } from 'src/core/database/generated/client'

export interface RetryJobData {
  learningObjectId: number
  contentTypes: BlockType[]
}
