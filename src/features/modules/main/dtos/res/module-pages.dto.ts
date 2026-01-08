import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { AiConfigurationDto } from 'src/features/modules/ai-configurations/dtos/res/ai-configuration.dto'
import { PageDto } from 'src/features/pages/dtos/res/page.dto'

export class ModulePagesDto {
  @ApiProperty({
    description: 'ID del módulo',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: 'Título del módulo',
    example: 'Introducción a la Programación',
  })
  title: string

  @ApiProperty({
    description: 'Descripción del módulo',
    example: 'Este módulo introduce los conceptos básicos de programación',
    nullable: true,
  })
  description: string | null

  @ApiProperty({
    description: 'ID del profesor que creó el módulo',
    example: 1,
  })
  teacherId: number

  @ApiProperty({
    description: 'Indica si el módulo es público',
    example: false,
  })
  isPublic: boolean

  @ApiProperty({
    description: 'Permite auto-inscripción de estudiantes',
    example: true,
  })
  allowSelfEnroll: boolean

  @ApiProperty({
    description: 'URL del logo del módulo',
    example: 'https://example.com/logo.png',
    nullable: true,
  })
  logoUrl: string | null

  @ApiProperty({
    description: 'Indica si el módulo está activo',
    example: true,
  })
  isActive: boolean

  @ApiProperty({
    description: 'Fecha de creación del módulo',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date

  @ApiProperty({
    description: 'Fecha de última actualización del módulo',
    example: '2024-01-02T00:00:00.000Z',
  })
  updatedAt: Date

  @ApiPropertyOptional({
    description: 'Configuración de IA del módulo',
    type: AiConfigurationDto,
    nullable: true,
  })
  aiConfiguration?: AiConfigurationDto | null

  @ApiPropertyOptional({
    description: 'Páginas del módulo',
    type: [PageDto],
    nullable: true,
  })
  pages?: PageDto[]
}
