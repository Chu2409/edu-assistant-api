import { ApiProperty } from '@nestjs/swagger'

export class PageConceptDto {
  @ApiProperty({ example: 1 })
  id: number

  @ApiProperty({ example: 1 })
  pageId: number

  @ApiProperty({ example: 'respiración celular' })
  term: string

  @ApiProperty({
    example:
      'Proceso por el cual las células convierten nutrientes en energía utilizable (ATP).',
  })
  definition: string

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date
}
