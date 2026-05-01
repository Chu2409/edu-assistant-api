import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { StudentAiFeedbackContent } from '../../interfaces/student-feedback-data.interface'

export class StudentFeedbackDto {
  @ApiProperty({ description: 'ID del feedback', example: 1 })
  id: number

  @ApiProperty({
    description: 'Scope del feedback',
    enum: ['WEEKLY_DIGEST'],
    example: 'WEEKLY_DIGEST',
  })
  scope: string

  @ApiProperty({ description: 'ID del módulo', example: 1 })
  moduleId: number

  @ApiProperty({
    description: 'Contenido estructurado del feedback generado por IA',
    type: Object,
  })
  content: StudentAiFeedbackContent

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date
}
