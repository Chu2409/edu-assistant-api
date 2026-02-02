import { ApiProperty } from '@nestjs/swagger'
import { ActivityType } from 'src/core/database/generated/enums'

export class GeneratedActivityDto {
  @ApiProperty({ enum: ActivityType })
  type: ActivityType

  @ApiProperty({ example: 2 })
  difficulty: number

  @ApiProperty()
  question: string

  @ApiProperty({
    nullable: true,
    description:
      'Depende del tipo: MULTIPLE_CHOICE/MATCH -> object; TRUE_FALSE/FILL_BLANK -> null',
  })
  options: Record<string, any> | null

  @ApiProperty({
    description:
      'Depende del tipo: MULTIPLE_CHOICE/TRUE_FALSE/FILL_BLANK/MATCH -> object',
  })
  correctAnswer: Record<string, any>

  @ApiProperty({ nullable: true })
  explanation: string | null
}
