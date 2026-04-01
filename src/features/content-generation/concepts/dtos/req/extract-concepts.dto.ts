import { ApiProperty } from '@nestjs/swagger'
import { IsInt } from 'class-validator'

export class ExtractConceptsDto {
  @ApiProperty({
    description: 'ID del objeto de aprendizaje de la cual extraer conceptos',
    example: 1,
  })
  @IsInt()
  learningObjectId: number
}
