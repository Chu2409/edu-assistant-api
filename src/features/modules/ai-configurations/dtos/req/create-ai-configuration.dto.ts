import { ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ArrayMinSize,
} from 'class-validator'
import {
  AiTargetLevel,
  AiAudience,
  AiLength,
  AiTone,
} from 'src/core/database/generated/enums'

export class CreateAiConfigurationDto {
  @ApiPropertyOptional({
    description: 'Idioma para la configuración de IA',
    example: 'es',
    default: 'es',
  })
  @IsOptional()
  @IsString()
  language?: string

  @ApiPropertyOptional({
    description: 'Nivel objetivo del contenido de IA',
    enum: AiTargetLevel,
    example: AiTargetLevel.INTERMEDIATE,
    default: AiTargetLevel.INTERMEDIATE,
  })
  @IsOptional()
  @IsEnum(AiTargetLevel)
  targetLevel?: AiTargetLevel

  @ApiPropertyOptional({
    description: 'Audiencia objetivo del contenido de IA',
    enum: AiAudience,
    example: AiAudience.UNIVERSITY,
    default: AiAudience.UNIVERSITY,
  })
  @IsOptional()
  @IsEnum(AiAudience)
  audience?: AiAudience

  @ApiPropertyOptional({
    description: 'Objetivos de aprendizaje del módulo',
    example: [
      'Comprender los conceptos básicos de programación',
      'Aplicar estructuras de control',
      'Desarrollar habilidades de resolución de problemas',
    ],
    type: [String],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  learningObjectives?: string[]

  @ApiPropertyOptional({
    description: 'Longitud del contenido generado por IA',
    enum: AiLength,
    example: AiLength.MEDIUM,
    default: AiLength.MEDIUM,
  })
  @IsOptional()
  @IsEnum(AiLength)
  contentLength?: AiLength

  @ApiPropertyOptional({
    description: 'Tono del contenido generado por IA',
    enum: AiTone,
    example: AiTone.EDUCATIONAL,
    default: AiTone.EDUCATIONAL,
  })
  @IsOptional()
  @IsEnum(AiTone)
  tone?: AiTone
}
