import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
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

export class CreateMediaResourceDto {
  @ApiProperty({ enum: MediaType, example: MediaType.IMAGE })
  @IsEnum(MediaType)
  type: MediaType

  @ApiProperty({
    description: 'URL del recurso (por ejemplo imagen generada)',
    example: 'https://example.com/image.png',
  })
  @IsString()
  @MinLength(1)
  url: string

  @ApiPropertyOptional({
    description: 'Título opcional',
    example: 'Diagrama de flujo',
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string | null

  @ApiPropertyOptional({
    description: 'URL de thumbnail (opcional)',
    example: 'https://example.com/thumb.png',
  })
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
