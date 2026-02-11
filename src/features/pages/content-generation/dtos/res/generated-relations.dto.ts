import { ApiProperty } from '@nestjs/swagger'

export class GeneratedPageRelation {
  @ApiProperty({
    example: 12,
    description: 'ID de la página relacionada',
  })
  targetPageId: number

  @ApiProperty({
    example: 'respiración celular',
    description: 'Texto exacto de la página actual que se enlazará',
  })
  mentionText: string
}

export class GeneratedRelationsDto {
  @ApiProperty({
    type: [GeneratedPageRelation],
    description: 'Relaciones identificadas por la IA',
  })
  relations: GeneratedPageRelation[]
}
