import { ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUrl,
  MinLength,
  MaxLength,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { UpdateAiConfigurationDto } from 'src/features/modules/ai-configurations/dtos/req/update-ai-configuration.dto'

export class UpdateModuleDto {
  @ApiPropertyOptional({
    description: 'Título del módulo',
    example: 'Introducción a la Programación Avanzada',
    minLength: 3,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string

  @ApiPropertyOptional({
    description: 'Descripción del módulo',
    example: 'Este módulo introduce los conceptos avanzados de programación',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({
    description: 'Indica si el módulo es público',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean

  @ApiPropertyOptional({
    description: 'Permite auto-inscripción de estudiantes',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  allowSelfEnroll?: boolean

  @ApiPropertyOptional({
    description: 'Permite auto-desinscripción de estudiantes',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  allowSelfUnenroll?: boolean

  @ApiPropertyOptional({
    description: 'URL del logo del módulo',
    example: 'https://example.com/new-logo.png',
    nullable: true,
  })
  @IsOptional()
  @IsUrl()
  logoUrl?: string

  @ApiPropertyOptional({
    description: 'Indica si el módulo está activo',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @ApiPropertyOptional({
    description: 'Configuración de IA para el módulo',
    type: UpdateAiConfigurationDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateAiConfigurationDto)
  aiConfiguration?: UpdateAiConfigurationDto
}
