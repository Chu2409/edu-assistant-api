import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { NoteDto } from 'src/features/pages/notes/dtos/res/note.dto'
import { PageFeedbackDto } from 'src/features/pages/page-feedbacks/dtos/res/page-feedback.dto'
import { StudentQuestionDto } from 'src/features/pages/student-questions/dtos/res/student-question.dto'

export class FullPageDto {
  @ApiProperty({
    description: 'ID de la página',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: 'ID del módulo al que pertenece la página',
    example: 1,
  })
  moduleId: number

  @ApiProperty({
    description: 'Título de la página',
    example: 'Introducción a la Programación',
  })
  title: string

  @ApiPropertyOptional({
    description: 'Índice de orden de la página dentro del módulo',
    example: 1,
  })
  orderIndex: number | null

  @ApiProperty({
    description: 'Palabras clave para búsquedas',
    example: ['programación', 'introducción', 'básicos'],
    type: [String],
  })
  keywords: string[]

  @ApiProperty({
    description: 'Indica si la página está publicada',
    example: false,
  })
  isPublished: boolean

  @ApiPropertyOptional({
    description: 'Fecha de último procesamiento del HTML',
    example: '2024-01-01T00:00:00.000Z',
    nullable: true,
  })
  lastProcessedAt: Date | null

  @ApiProperty({
    description:
      'Versión de procesamiento para re-procesar si cambia la lógica',
    example: 1,
  })
  processingVersion: number

  @ApiProperty({
    description: 'Fecha de creación de la página',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date

  @ApiProperty({
    description: 'Fecha de última actualización de la página',
    example: '2024-01-02T00:00:00.000Z',
  })
  updatedAt: Date

  @ApiProperty({
    description: 'Preguntas de los estudiantes',
    type: [StudentQuestionDto],
  })
  studentQuestions: StudentQuestionDto[]

  @ApiPropertyOptional({
    description: 'Reseñas de la página',
    type: [PageFeedbackDto],
    nullable: true,
  })
  pageFeedbacks: PageFeedbackDto[] | null

  @ApiPropertyOptional({
    description: 'Notas de la página',
    type: [NoteDto],
    nullable: true,
  })
  notes: NoteDto[] | null
}
