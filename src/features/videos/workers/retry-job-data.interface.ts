import { BlockType } from 'src/core/database/generated/client'

export interface RetryJobData {
  videoId: number
  contentTypes: BlockType[]
}
