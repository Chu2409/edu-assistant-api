import { ApiProperty } from '@nestjs/swagger'
import { IsString, MaxLength, MinLength } from 'class-validator'

export class CreatePageConceptDto {
  @ApiProperty({
    description: 'Término exacto que aparece en el contenido',
    example: 'respiración celular',
    minLength: 1,
    maxLength: 120,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  term: string

  @ApiProperty({
    description: 'Definición corta para tooltip',
    example:
      'Proceso por el cual las células convierten nutrientes en energía utilizable (ATP).',
    minLength: 1,
    maxLength: 800,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(800)
  definition: string
}
