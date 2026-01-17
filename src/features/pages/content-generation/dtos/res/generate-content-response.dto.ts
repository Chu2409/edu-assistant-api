import { ApiProperty } from '@nestjs/swagger'
import { PageDto } from 'src/features/pages/main/dtos/res/page.dto'

export class PageConceptDto {
  @ApiProperty({
    description: 'ID del concepto',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: 'ID de la página',
    example: 1,
  })
  pageId: number

  @ApiProperty({
    description: 'Término del concepto',
    example: 'Fotosíntesis',
  })
  term: string

  @ApiProperty({
    description: 'Definición del concepto',
    example:
      'Proceso por el cual las plantas convierten la luz solar en energía química',
  })
  definition: string

  @ApiProperty({
    description: 'ID único en el HTML',
    example: 'concept-c123',
  })
  htmlId: string

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date
}

export class GenerateContentStatsDto {
  @ApiProperty({
    description: 'Número de palabras en el contenido generado',
    example: 850,
  })
  wordsCount: number

  @ApiProperty({
    description: 'Número de conceptos extraídos',
    example: 5,
  })
  conceptsExtracted: number

  @ApiProperty({
    description: 'Tiempo de procesamiento en milisegundos',
    example: 2340,
  })
  processingTimeMs: number
}

export class GenerateContentResponseDto {
  @ApiProperty({
    description: 'Página generada',
    type: PageDto,
  })
  page: PageDto

  @ApiProperty({
    description: 'Conceptos extraídos e incrustados',
    type: [PageConceptDto],
  })
  concepts: PageConceptDto[]

  @ApiProperty({
    description: 'Estadísticas de la generación',
    type: GenerateContentStatsDto,
  })
  stats: GenerateContentStatsDto
}
