import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsInt, Min, MaxLength, IsOptional, IsEnum } from 'class-validator'
import { AiAudience, AiLength, AiTone } from 'src/core/database/generated/enums'
import { AiTargetLevel } from 'src/core/database/generated/enums'

export class RegenerateContentDto {
  @ApiProperty({
    description: 'ID de la página a generar contenido',
    example: 1,
  })
  @IsInt()
  @Min(1)
  pageId: number

  @ApiProperty({
    description: 'Instrucciones específicas para la generación del contenido',
    example:
      'Enfócate en ejemplos prácticos de programación orientada a objetos',
    maxLength: 1000,
  })
  @IsString()
  @MaxLength(1000)
  instructions: string

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
}
