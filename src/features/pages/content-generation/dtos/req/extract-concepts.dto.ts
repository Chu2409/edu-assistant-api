import { ApiProperty } from '@nestjs/swagger'
import { IsInt } from 'class-validator'

export class ExtractConceptsDto {
  @ApiProperty({
    description: 'ID de la página de la cual extraer conceptos',
    example: 1,
  })
  @IsInt()
  pageId: number
}
