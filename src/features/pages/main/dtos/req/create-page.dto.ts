import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator'
import { Type } from 'class-transformer'

export class CreatePageDto {
  @ApiProperty({
    description: 'ID del módulo al que pertenece la página',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  moduleId: number

  @ApiProperty({
    description: 'Título de la página',
    example: 'Introducción a la Programación',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string

  @ApiProperty({
    description: 'Contenido HTML procesado con conceptos y enlaces incrustados',
    example: '<p>Este es el contenido HTML procesado...</p>',
  })
  @IsString()
  content: string

  @ApiPropertyOptional({
    description: 'Contenido original sin procesar',
    example: 'Este es el contenido original en texto plano',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  rawContent?: string

  @ApiProperty({
    description: 'Índice de orden de la página dentro del módulo',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  orderIndex: number

  @ApiPropertyOptional({
    description: 'Palabras clave para búsquedas',
    example: ['programación', 'introducción', 'básicos'],
    type: [String],
    default: [],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[]

  @ApiPropertyOptional({
    description: 'Indica si la página está publicada',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean
}
