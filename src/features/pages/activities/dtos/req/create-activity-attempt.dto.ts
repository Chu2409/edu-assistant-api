import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsObject } from 'class-validator'
import type { ActivityAttemptAnswer } from '../../interfaces/activity-attempt.interface'

export class CreateActivityAttemptDto {
  @ApiProperty({
    description: 'Respuesta del estudiante',
    example: { value: true },
  })
  @IsObject()
  @IsNotEmpty()
  studentAnswer: ActivityAttemptAnswer
}
