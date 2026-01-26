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

export class UpdateAiConfigurationDto {
  @ApiPropertyOptional({
    description: 'Idioma para la configuración de IA',
    example: 'en',
  })
  @IsOptional()
  @IsString()
  language?: string

  @ApiPropertyOptional({
    description: 'Prompt de contexto personalizado para el módulo',
    example: 'Este módulo trata sobre programación avanzada en Python',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  contextPrompt?: string

  @ApiPropertyOptional({
    description: 'Nivel objetivo del contenido de IA',
    enum: AiTargetLevel,
    example: AiTargetLevel.ADVANCED,
  })
  @IsOptional()
  @IsEnum(AiTargetLevel)
  targetLevel?: AiTargetLevel

  @ApiPropertyOptional({
    description: 'Audiencia objetivo del contenido de IA',
    enum: AiAudience,
    example: AiAudience.PROFESSIONAL,
  })
  @IsOptional()
  @IsEnum(AiAudience)
  audience?: AiAudience

  @ApiPropertyOptional({
    description: 'Objetivos de aprendizaje del módulo',
    example: [
      'Comprender los conceptos avanzados de programación',
      'Aplicar patrones de diseño',
      'Desarrollar aplicaciones complejas',
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
    example: AiLength.LONG,
  })
  @IsOptional()
  @IsEnum(AiLength)
  contentLength?: AiLength

  @ApiPropertyOptional({
    description: 'Tono del contenido generado por IA',
    enum: AiTone,
    example: AiTone.FORMAL,
  })
  @IsOptional()
  @IsEnum(AiTone)
  tone?: AiTone
}
