import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsArray, IsInt, ValidateNested } from 'class-validator'

class ReorderLo {
  @ApiProperty({
    description: 'ID del objeto de aprendizaje',
    example: 1,
  })
  @IsInt()
  id: number

  @ApiProperty({
    description: 'Índice de orden del objeto de aprendizaje',
    example: 1,
  })
  @IsInt()
  orderIndex: number
}

export class ReorderLoDto {
  @ApiProperty({
    description: 'Objetos de aprendizaje a reordenar',
    type: [ReorderLo],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderLo)
  los: ReorderLo[]
}
