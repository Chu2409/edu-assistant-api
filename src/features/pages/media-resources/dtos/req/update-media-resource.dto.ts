import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator'
import { MediaType } from 'src/core/database/generated/enums'

export class UpdateMediaResourceDto {
  @ApiPropertyOptional({ enum: MediaType })
  @IsOptional()
  @IsEnum(MediaType)
  type?: MediaType

  @ApiPropertyOptional({ description: 'URL del recurso', minLength: 1 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  url?: string

  @ApiPropertyOptional({ description: 'Título', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string | null

  @ApiPropertyOptional({ description: 'URL de thumbnail' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string | null

  @ApiPropertyOptional({
    description: 'Tamaño de archivo en bytes',
    example: 123456,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  fileSize?: number | null

  @ApiPropertyOptional({
    description: 'MIME type',
    example: 'image/png',
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  mimeType?: string | null
}
