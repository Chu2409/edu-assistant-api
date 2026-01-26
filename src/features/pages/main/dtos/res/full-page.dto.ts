import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { BlockDto } from 'src/features/pages/blocks/dtos/res/block.dto'
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

  @ApiProperty({
    description: 'Array de bloques de contenido',
    type: [BlockDto],
    example: [
      {
        id: 1,
        type: 'TEXT',
        content: {
          markdown:
            '# Introducción\n\nTypeScript es un lenguaje de programación...',
        },
      },
      {
        id: 2,
        type: 'CODE',
        content: {
          language: 'typescript',
          code: 'const greeting: string = "Hello, World!"\nconsole.log(greeting)',
        },
      },
      {
        id: 3,
        type: 'IMAGE_SUGGESTION',
        content: {
          prompt:
            'Ejemplo gráfico de herencia en Java mostrando una clase Animal y subclases Perro y Gato, con flechas que indican la relación de herencia, estilo diagrama UML simplificado y claro para estudiantes universitarios.',
          reason:
            'Para ilustrar visualmente la herencia como concepto clave en Java.',
        },
      },
    ],
  })
  blocks: BlockDto[]
}
