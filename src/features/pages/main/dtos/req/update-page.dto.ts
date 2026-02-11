import { ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
  IsArray,
} from 'class-validator'

export class UpdatePageDto {
  @ApiPropertyOptional({
    description: 'Título de la página',
    example: 'Introducción a la Programación Avanzada',
    minLength: 3,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string

  @ApiPropertyOptional({
    description: 'Palabras clave para búsquedas',
    example: ['programación', 'introducción', 'básicos'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[]

  @ApiPropertyOptional({
    description: 'Indica si la página está publicada',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean

  @ApiPropertyOptional({
    description: 'Indica si la página tiene ediciones manuales',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  hasManualEdits?: boolean
}
