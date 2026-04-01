import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class UpdatePageConceptDto {
  @ApiPropertyOptional({
    description: 'Término (exacto como aparece en el contenido)',
    example: 'respiración celular',
    minLength: 1,
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  term?: string

  @ApiPropertyOptional({
    description: 'Definición corta para tooltip',
    example:
      'Proceso por el cual las células convierten nutrientes en energía utilizable (ATP).',
    minLength: 1,
    maxLength: 800,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(800)
  definition?: string
}
