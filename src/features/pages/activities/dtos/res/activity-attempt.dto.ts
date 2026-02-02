import { ApiProperty } from '@nestjs/swagger'

export class ActivityAttemptDto {
  @ApiProperty({ example: 1 })
  id: number

  @ApiProperty({ example: 1 })
  activityId: number

  @ApiProperty({ example: 1 })
  userId: number

  @ApiProperty({ description: 'Respuesta del estudiante (JSON)' })
  studentAnswer: Record<string, any>

  @ApiProperty({ example: true })
  isCorrect: boolean

  @ApiProperty({ example: 1 })
  attemptNumber: number

  @ApiProperty()
  createdAt: Date
}
