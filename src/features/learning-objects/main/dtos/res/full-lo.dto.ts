import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { BlockDto } from 'src/features/learning-objects/blocks/dtos/res/block.dto'
import { NoteDto } from 'src/features/interactions/notes/dtos/res/note.dto'
import { LoFeedbackDto } from 'src/features/interactions/lo-feedbacks/dtos/res/lo-feedback.dto'
import { StudentQuestionDto } from 'src/features/interactions/student-questions/dtos/res/student-question.dto'
import { LoTypeDto } from './lo-type.dto'

export class FullLoDto {
  @ApiProperty({
    description: 'ID del objeto de aprendizaje',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: 'ID del módulo al que pertenece el objeto de aprendizaje',
    example: 1,
  })
  moduleId: number

  @ApiProperty({
    description: 'Título del objeto de aprendizaje',
    example: 'Introducción a la Programación',
  })
  title: string

  @ApiProperty({
    description: 'Tipo de objeto de aprendizaje',
    type: () => LoTypeDto,
  })
  type: LoTypeDto

  @ApiPropertyOptional({
    description: 'Índice de orden del objeto de aprendizaje dentro del módulo',
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
    description: 'Indica si el objeto de aprendizaje está publicado',
    example: false,
  })
  isPublished: boolean

  @ApiProperty({
    description: 'Fecha de creación del objeto de aprendizaje',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date

  @ApiProperty({
    description: 'Fecha de última actualización del objeto de aprendizaje',
    example: '2024-01-02T00:00:00.000Z',
  })
  updatedAt: Date

  @ApiProperty({
    description: 'Preguntas de los estudiantes',
    type: [StudentQuestionDto],
  })
  studentQuestions: StudentQuestionDto[]

  @ApiPropertyOptional({
    description: 'Reseñas del objeto de aprendizaje',
    type: [LoFeedbackDto],
    nullable: true,
  })
  loFeedbacks: LoFeedbackDto[] | null

  @ApiPropertyOptional({
    description: 'Notas del objeto de aprendizaje',
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
        tipTapContent: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Este es un párrafo con **texto en negrita**.',
                },
              ],
            },
          ],
        },
      },
      {
        id: 2,
        type: 'CODE',
        content: {
          language: 'typescript',
          code: 'const greeting: string = "Hello, World!"\nconsole.log(greeting)',
        },
        tipTapContent: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Este es un párrafo con **texto en negrita**.',
                },
              ],
            },
          ],
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
        tipTapContent: { type: 'doc', content: [] },
      },
    ],
  })
  blocks: BlockDto[]

  @ApiPropertyOptional({
    description:
      'ID de la sesión de chat con IA asociada a este objeto de aprendizaje y usuario actual',
    example: 1,
    nullable: true,
  })
  chatSessionId?: number | null

  @ApiPropertyOptional({
    description: 'ID del objeto de aprendizaje anterior (basado en orderIndex)',
    example: 1,
    nullable: true,
  })
  previousLoId?: number | null

  @ApiPropertyOptional({
    description:
      'ID del objeto de aprendizaje siguiente (basado en orderIndex)',
    example: 3,
    nullable: true,
  })
  nextLoId?: number | null
}
