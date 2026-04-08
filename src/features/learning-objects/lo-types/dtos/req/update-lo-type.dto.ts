import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator'

export class UpdateLoTypeDto {
  @ApiPropertyOptional({
    description: 'Nombre único del tipo de objeto de aprendizaje',
    example: 'Lección Teórica',
    minLength: 3,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name?: string

  @ApiPropertyOptional({
    description: 'Descripción detallada del propósito del tipo',
    example: 'Contenido enfocado en la teoría pura.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string
}
