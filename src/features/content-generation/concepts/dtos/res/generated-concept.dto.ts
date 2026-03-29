import { ApiProperty } from '@nestjs/swagger'

export class GeneratedConceptDto {
  @ApiProperty({
    description: 'Término extraído del contenido',
    example: 'Polimorfismo',
  })
  term: string

  @ApiProperty({
    description: 'Definición del término extraído',
    example: 'Capacidad de un objeto para tomar muchas formas.',
  })
  definition: string
}

export class PageConceptsExtractedDto {
  @ApiProperty({
    description: 'Array de conceptos extraídos del contenido',
    type: [GeneratedConceptDto],
    example: [
      {
        term: 'Polimorfismo',
        definition: 'Capacidad de un objeto para tomar muchas formas.',
      },
      {
        term: 'Encapsulamiento',
        definition:
          'Mecanismo de ocultar los datos internos de un objeto y exponer solo lo necesario.',
      },
    ],
  })
  terms: GeneratedConceptDto[]
}
