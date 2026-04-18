import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IngestionStatus } from 'src/core/database/generated/client'

export class VideoStatusDto {
  @ApiProperty({ example: 1 })
  id: number

  @ApiProperty({ enum: IngestionStatus, example: IngestionStatus.COMPLETED })
  status: IngestionStatus

  @ApiPropertyOptional({ example: 'Transcription failed' })
  errorMessage?: string | null

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z' })
  startedAt?: Date | null

  @ApiPropertyOptional({ example: '2024-01-01T00:00:30.000Z' })
  completedAt?: Date | null
}
