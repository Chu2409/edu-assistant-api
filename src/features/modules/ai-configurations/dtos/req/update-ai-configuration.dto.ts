import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator'

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
    description: 'Temperatura para la generación de IA (0.0 - 1.0)',
    example: 0.8,
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temperature?: number
}
