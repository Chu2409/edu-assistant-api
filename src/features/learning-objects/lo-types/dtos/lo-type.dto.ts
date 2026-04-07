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

export class LoTypeDto {
  @ApiProperty({ example: 1 })
  id: number

  @ApiProperty({ example: 'Lección Interactiva' })
  name: string

  @ApiPropertyOptional({ example: 'Descripción...', nullable: true })
  description?: string | null

  @ApiProperty({ example: '2026-04-07T12:00:00Z' })
  createdAt: Date

  @ApiProperty({ example: '2026-04-07T12:00:00Z' })
  updatedAt: Date
}
