import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsEnum,
  IsArray,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator'
import { Type } from 'class-transformer'
import {
  AiAudience,
  AiLength,
  AiTargetLevel,
  AiTone,
} from 'src/core/database/generated/enums'

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

  @ApiPropertyOptional({
    description: 'Indica si la página está publicada',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean

  @ApiPropertyOptional({
    description: 'Instrucciones específicas para la generación del contenido',
    example:
      'Enfócate en ejemplos prácticos de programación orientada a objetos',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instructions?: string

  @ApiPropertyOptional({
    description:
      'Idioma del contenido (sobrescribe la configuración del módulo)',
    example: 'es',
    enum: ['es', 'en'],
  })
  @IsOptional()
  @IsString()
  language?: string

  @ApiPropertyOptional({
    description:
      'Nivel objetivo del contenido (sobrescribe la configuración del módulo)',
    enum: AiTargetLevel,
    example: AiTargetLevel.INTERMEDIATE,
  })
  @IsOptional()
  @IsEnum(AiTargetLevel)
  targetLevel?: AiTargetLevel

  @ApiPropertyOptional({
    description: 'Audiencia objetivo (sobrescribe la configuración del módulo)',
    enum: AiAudience,
    example: AiAudience.UNIVERSITY,
  })
  @IsOptional()
  @IsEnum(AiAudience)
  audience?: AiAudience

  @ApiPropertyOptional({
    description:
      'Longitud del contenido (sobrescribe la configuración del módulo)',
    enum: AiLength,
    example: AiLength.MEDIUM,
  })
  @IsOptional()
  @IsEnum(AiLength)
  contentLength?: AiLength

  @ApiPropertyOptional({
    description: 'Tono del contenido (sobrescribe la configuración del módulo)',
    enum: AiTone,
    example: AiTone.EDUCATIONAL,
  })
  @IsOptional()
  @IsEnum(AiTone)
  tone?: AiTone

  @ApiPropertyOptional({
    description:
      'Objetivos de aprendizaje (sobrescribe la configuración del módulo)',
    example: [
      'Entender los conceptos básicos',
      'Aplicar los conocimientos en ejemplos prácticos',
    ],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  learningObjectives?: string[]
}
