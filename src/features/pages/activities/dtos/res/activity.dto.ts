import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ActivityType } from 'src/core/database/generated/enums'

export class ActivityDto {
  @ApiProperty({ example: 1 })
  id: number

  @ApiProperty({ example: 1 })
  pageId: number

  @ApiProperty({ enum: ActivityType, example: ActivityType.MULTIPLE_CHOICE })
  type: ActivityType

  @ApiProperty({ example: '¿Cuál es la salida del siguiente código?' })
  question: string

  @ApiPropertyOptional({ description: 'Opciones (JSON)' })
  options: Record<string, any> | null

  @ApiProperty({ description: 'Respuesta correcta (JSON)' })
  correctAnswer: Record<string, any>

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
