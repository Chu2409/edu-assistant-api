import { ApiProperty, getSchemaPath } from '@nestjs/swagger'
import { IsNotEmpty, IsObject } from 'class-validator'
import {
  FillBlankAttempt,
  MatchAttempt,
  MultipleChoiceAttempt,
  TrueFalseAttempt,
  type ActivityAttemptAnswer,
} from '../../interfaces/activity-attempt.interface'

export class CreateActivityAttemptDto {
  @ApiProperty({
    description: 'Respuesta del estudiante',
    oneOf: [
      { $ref: getSchemaPath(MultipleChoiceAttempt) },
      { $ref: getSchemaPath(TrueFalseAttempt) },
      { $ref: getSchemaPath(FillBlankAttempt) },
      { $ref: getSchemaPath(MatchAttempt) },
    ],
    example: { selectedOption: 2 },
  })
  @IsObject()
  @IsNotEmpty()
  studentAnswer: ActivityAttemptAnswer
}
