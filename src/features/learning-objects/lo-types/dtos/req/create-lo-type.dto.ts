import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator'

export class CreateLoTypeDto {
  @ApiProperty({
    description: 'Nombre único del tipo de objeto de aprendizaje',
    example: 'Lección Interactiva',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name: string

  @ApiPropertyOptional({
    description: 'Descripción detallada del propósito del tipo',
    example: 'Contenido teórico con elementos multimedia y ejercicios rápidos.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string
}
