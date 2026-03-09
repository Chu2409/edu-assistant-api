import {
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger'
import { ActivityType } from 'src/core/database/generated/enums'
import type { AiGeneratedActivity } from 'src/features/pages/content-generation/interfaces/ai-generated-activity.interface'
import {
  FillBlankAttempt,
  MatchAttempt,
  MultipleChoiceAttempt,
  TrueFalseAttempt,
} from '../../interfaces/activity-attempt.interface'

export class ActivityDto {
  @ApiProperty({ example: 1 })
  id: number

  @ApiProperty({ example: 1 })
  pageId: number

  @ApiProperty({ enum: ActivityType, example: ActivityType.MULTIPLE_CHOICE })
  type: ActivityType

  @ApiProperty({ example: '¿Cuál es la salida del siguiente código?' })
  question: string

  @ApiPropertyOptional({
    description: 'Opciones (JSON)',
    oneOf: [
      { $ref: getSchemaPath(MultipleChoiceAttempt) },
      { $ref: getSchemaPath(TrueFalseAttempt) },
      { $ref: getSchemaPath(FillBlankAttempt) },
      { $ref: getSchemaPath(MatchAttempt) },
    ],
  })
  options: AiGeneratedActivity

  @ApiPropertyOptional({ description: 'Explicación' })
  explanation: string | null

  @ApiProperty({ example: 2 })
  difficulty: number

  @ApiProperty({ example: 1 })
  orderIndex: number

  @ApiProperty({ example: false })
  isApprovedByTeacher: boolean

  @ApiProperty({ example: false })
  usedAsExample: boolean

  @ApiPropertyOptional({ example: null })
  generatedFromId: number | null

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date
}
