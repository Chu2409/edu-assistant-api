import { ApiProperty } from '@nestjs/swagger'
import { IsInt, Min } from 'class-validator'

export class ReorderLoDto {
  @ApiProperty({
    description: 'ID del objeto de aprendizaje a mover',
    example: 1,
  })
  @IsInt()
  id: number

  @ApiProperty({
    description: 'Nuevo índice de orden absoluto (1-based)',
    example: 2,
  })
  @IsInt()
  @Min(1)
  orderIndex: number
}
