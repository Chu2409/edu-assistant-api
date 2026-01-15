import { ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  MinLength,
  MaxLength,
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
    description: 'Contenido HTML procesado con conceptos y enlaces incrustados',
    example: '<p>Este es el contenido HTML procesado actualizado...</p>',
  })
  @IsOptional()
  @IsString()
  content?: string

  @ApiPropertyOptional({
    description: 'Palabras clave para búsquedas',
    example: ['programación', 'avanzado', 'conceptos'],
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
}
