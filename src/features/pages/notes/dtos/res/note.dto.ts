import { ApiProperty } from '@nestjs/swagger'

export class NoteDto {
  @ApiProperty({
    description: 'ID de la nota',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: 'Contenido de la nota',
    example: 'Este es el contenido de la nota',
  })
  content: string

  @ApiProperty({
    description: 'Fecha de creación de la nota',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date
}
