import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { AiFeedbackContent } from '../../interfaces/feedback-data.interface'

export class TeacherFeedbackDto {
  @ApiProperty({ description: 'ID del feedback', example: 1 })
  id: number

  @ApiProperty({
    description: 'Scope del feedback',
    enum: ['LEARNING_OBJECT', 'MODULE'],
    example: 'LEARNING_OBJECT',
  })
  scope: string

  @ApiProperty({ description: 'ID del módulo', example: 1 })
  moduleId: number

  @ApiPropertyOptional({
    description: 'ID del objeto de aprendizaje (null si scope es MODULE)',
    example: 5,
  })
  learningObjectId: number | null

  @ApiProperty({
    description: 'Contenido estructurado del feedback generado por IA',
    type: Object,
  })
  content: AiFeedbackContent

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date
}
