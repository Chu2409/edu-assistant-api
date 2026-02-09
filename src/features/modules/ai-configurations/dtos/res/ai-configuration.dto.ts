import { ApiProperty } from '@nestjs/swagger'
import {
  AiAudience,
  AiLength,
  AiTargetLevel,
  AiTone,
} from 'src/core/database/generated/enums'

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
    description: 'Nivel de target para la configuración de IA',
    example: AiTargetLevel.INTERMEDIATE,
  })
  targetLevel: AiTargetLevel

  @ApiProperty({
    description: 'Audiencia para la configuración de IA',
    example: AiAudience.UNIVERSITY,
  })
  audience: AiAudience

  @ApiProperty({
    description: 'Longitud del contenido para la configuración de IA',
    example: AiLength.MEDIUM,
  })
  contentLength: AiLength

  @ApiProperty({
    description: 'Tono para la configuración de IA',
    example: AiTone.EDUCATIONAL,
  })
  tone: AiTone

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
