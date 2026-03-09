import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional, IsEnum } from 'class-validator'
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
