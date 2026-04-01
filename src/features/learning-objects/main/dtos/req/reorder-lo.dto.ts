import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsArray, IsInt, ValidateNested } from 'class-validator'

class ReorderLo {
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

export class ReorderLoDto {
  @ApiProperty({
    description: 'Páginas a reordenar',
    type: [ReorderLo],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderLo)
  pages: ReorderLo[]
}
