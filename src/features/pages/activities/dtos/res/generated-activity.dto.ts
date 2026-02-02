import { ApiProperty } from '@nestjs/swagger'
import { ActivityType } from 'src/core/database/generated/enums'

export class GeneratedActivityDto {
  @ApiProperty({ enum: ActivityType })
  type: ActivityType

  @ApiProperty()
  question: string

  @ApiProperty({ nullable: true })
  options: Record<string, any> | null

  @ApiProperty()
  correctAnswer: Record<string, any>

  @ApiProperty({ nullable: true })
  explanation: string | null

  @ApiProperty({ example: 2 })
  difficulty: number
}
