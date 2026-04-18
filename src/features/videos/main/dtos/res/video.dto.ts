import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IngestionStatus, SourceKind } from 'src/core/database/generated/client'

export class VideoDto {
  @ApiProperty({ example: 1 })
  id: number

  @ApiProperty({ example: 1 })
  learningObjectId: number

  @ApiProperty({ example: 1 })
  moduleId: number

  @ApiProperty({ example: 'Introduction to Algorithms' })
  title: string

  @ApiProperty({ enum: SourceKind, example: SourceKind.YOUTUBE_URL })
  sourceKind: SourceKind

  @ApiProperty({ example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
  sourceUrl: string

  @ApiProperty({ enum: IngestionStatus, example: IngestionStatus.PENDING })
  status: IngestionStatus

  @ApiPropertyOptional({ example: 'auto' })
  outputLanguage: string

  @ApiPropertyOptional({ example: 120.5 })
  durationSeconds?: number | null

  @ApiProperty({ example: false })
  isPublished: boolean

  @ApiPropertyOptional({ example: 'Transcription failed' })
  errorMessage?: string | null

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date
}
