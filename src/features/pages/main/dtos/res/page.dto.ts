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
