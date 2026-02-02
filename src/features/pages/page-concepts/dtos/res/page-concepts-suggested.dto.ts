import { ApiProperty } from '@nestjs/swagger'

export class SuggestedTermDto {
  @ApiProperty({ example: 'respiración celular' })
  term: string

  @ApiProperty({
    example:
      'Proceso por el cual las células convierten nutrientes en energía utilizable (ATP).',
  })
  definition: string
}

export class PageConceptAnchorDto {
  @ApiProperty({ example: 10 })
  blockId: number

  @ApiProperty({ type: [SuggestedTermDto] })
  terms: SuggestedTermDto[]
}

export class PageConceptsSuggestedDto {
  @ApiProperty({ type: [PageConceptAnchorDto] })
  anchors: PageConceptAnchorDto[]
}
