import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional } from 'class-validator'

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
    description: 'Prompt de contexto personalizado para el módulo',
    example: 'Este módulo trata sobre programación en Python',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  contextPrompt?: string
}
