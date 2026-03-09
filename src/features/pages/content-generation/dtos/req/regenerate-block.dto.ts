import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsInt,
  Min,
  MaxLength,
  IsOptional,
  IsEnum,
} from 'class-validator'
import {
  AiAudience,
  AiTargetLevel,
  AiTone,
} from 'src/core/database/generated/enums'

export class RegenerateBlockDto {
  @ApiProperty({
    description: 'ID de la página que contiene el bloque',
    example: 1,
  })
  @IsInt()
  @Min(1)
  pageId: number

  @ApiProperty({
    description: 'Índice del bloque a regenerar (0-based)',
    example: 0,
  })
  @IsInt()
  @Min(0)
  blockIndex: number

  @ApiProperty({
    description: 'Instrucciones para modificar el bloque',
    example: 'Añade un ejemplo práctico de código',
    maxLength: 1000,
  })
  @IsString()
  @MaxLength(1000)
  instruction: string

  @ApiPropertyOptional({
    description:
      'Idioma del contenido (sobrescribe la configuración del módulo)',
    example: 'es',
  })
  @IsOptional()
  @IsString()
  language?: string

  @ApiPropertyOptional({
    description:
      'Nivel objetivo del contenido (sobrescribe la configuración del módulo)',
    enum: AiTargetLevel,
  })
  @IsOptional()
  @IsEnum(AiTargetLevel)
  targetLevel?: AiTargetLevel

  @ApiPropertyOptional({
    description: 'Audiencia objetivo (sobrescribe la configuración del módulo)',
    enum: AiAudience,
  })
  @IsOptional()
  @IsEnum(AiAudience)
  audience?: AiAudience

  @ApiPropertyOptional({
    description: 'Tono del contenido (sobrescribe la configuración del módulo)',
    enum: AiTone,
  })
  @IsOptional()
  @IsEnum(AiTone)
  tone?: AiTone
}
