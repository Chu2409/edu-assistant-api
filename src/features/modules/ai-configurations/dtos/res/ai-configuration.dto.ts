import { ApiProperty } from '@nestjs/swagger'

export class AiConfigurationDto {
  @ApiProperty({
    description: 'ID de la configuración de IA',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: 'ID del módulo asociado',
    example: 1,
  })
  moduleId: number

  @ApiProperty({
    description: 'Idioma para la configuración de IA',
    example: 'es',
  })
  language: string

  @ApiProperty({
    description: 'Prompt de contexto personalizado para el módulo',
    example: 'Este módulo trata sobre programación en Python',
    nullable: true,
  })
  contextPrompt: string | null

  @ApiProperty({
    description: 'Temperatura para la generación de IA',
    example: 0.7,
  })
  temperature: number

  @ApiProperty({
    description: 'Fecha de creación de la configuración',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date

  @ApiProperty({
    description: 'Fecha de última actualización de la configuración',
    example: '2024-01-02T00:00:00.000Z',
  })
  updatedAt: Date
}
