import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IngestionStatus, SourceKind } from 'src/core/database/generated/client'
import { BlockDto } from 'src/features/learning-objects/blocks/dtos/res/block.dto'

export class FullVideoDto {
  @ApiProperty({ example: 1 })
  id: number

  @ApiProperty({ example: 1 })
  moduleId: number

  @ApiProperty({ example: 'Introduction to Algorithms' })
  title: string

  @ApiProperty({ enum: SourceKind })
  sourceKind: SourceKind

  @ApiProperty({ example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
  sourceUrl: string

  @ApiProperty({ enum: IngestionStatus })
  status: IngestionStatus

  @ApiPropertyOptional({ example: 'auto' })
  outputLanguage: string

  @ApiPropertyOptional({ example: 120.5 })
  durationSeconds?: number | null

  @ApiPropertyOptional()
  detectedLanguage?: string | null

  @ApiPropertyOptional()
  transcription?: string | null

  @ApiProperty({ example: false })
  isPublished: boolean

  @ApiPropertyOptional()
  errorMessage?: string | null

  @ApiPropertyOptional()
  metadata?: Record<string, unknown> | null

  @ApiProperty({ type: [BlockDto] })
  blocks: BlockDto[]

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date
}
