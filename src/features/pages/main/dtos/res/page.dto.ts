import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class PageDto {
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

  @ApiProperty({
    description: 'Contenido HTML procesado con conceptos y enlaces incrustados',
    example: '<p>Este es el contenido HTML procesado...</p>',
  })
  content: string

  @ApiPropertyOptional({
    description: 'Contenido original sin procesar',
    example: 'Este es el contenido original en texto plano',
    nullable: true,
  })
  rawContent: string | null

  @ApiProperty({
    description: 'Índice de orden de la página dentro del módulo',
    example: 1,
  })
  orderIndex: number

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
}
