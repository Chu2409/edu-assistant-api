import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
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
import { CreateAiConfigurationDto } from 'src/features/modules/ai-configurations/dtos/req/create-ai-configuration.dto'

export class CreateModuleDto {
  @ApiProperty({
    description: 'Título del módulo',
    example: 'Introducción a la Programación',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string

  @ApiPropertyOptional({
    description: 'Descripción del módulo',
    example: 'Este módulo introduce los conceptos básicos de programación',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({
    description: 'Indica si el módulo es público',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean

  @ApiPropertyOptional({
    description: 'Permite auto-inscripción de estudiantes',
    example: true,
    default: true,
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
    example: 'https://example.com/logo.png',
    nullable: true,
  })
  @IsOptional()
  @IsUrl()
  logoUrl?: string

  @ApiPropertyOptional({
    description: 'Configuración de IA para el módulo',
    type: CreateAiConfigurationDto,
  })
  @ValidateNested()
  @Type(() => CreateAiConfigurationDto)
  aiConfiguration: CreateAiConfigurationDto
}
