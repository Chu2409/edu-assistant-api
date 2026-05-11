import { ApiProperty } from '@nestjs/swagger'

export class LoProgressDto {
  @ApiProperty({ example: 1 })
  id: number

  @ApiProperty({ example: 1 })
  learningObjectId: number

  @ApiProperty({ example: 1 })
  userId: number

  @ApiProperty({ example: false })
  isCompleted: boolean

  @ApiProperty({ example: '2026-05-11T12:00:00.000Z', required: false })
  completedAt?: Date | null

  @ApiProperty({ example: '2026-05-11T12:00:00.000Z' })
  lastVisitedAt: Date

  @ApiProperty({ example: '2026-05-11T12:00:00.000Z' })
  createdAt: Date

  @ApiProperty({ example: '2026-05-11T12:00:00.000Z' })
  updatedAt: Date
}
