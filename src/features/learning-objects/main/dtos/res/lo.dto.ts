import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { LoTypeDto } from 'src/features/learning-objects/lo-types/dtos/res/lo-type.dto'

export class LoDto {
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
