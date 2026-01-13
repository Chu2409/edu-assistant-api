import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsArray, IsInt, ValidateNested } from 'class-validator'

class ReorderPage {
  @ApiProperty({
    description: 'ID de la página',
    example: 1,
  })
  @IsInt()
  id: number

  @ApiProperty({
    description: 'Índice de orden de la página',
    example: 1,
  })
  @IsInt()
  orderIndex: number
}

export class ReorderPagesDto {
  @ApiProperty({
    description: 'Páginas a reordenar',
    type: [ReorderPage],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderPage)
  pages: ReorderPage[]
}
