import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional } from 'class-validator'

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
}
