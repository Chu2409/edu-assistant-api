import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator'
import { RelationType } from 'src/core/database/generated/enums'

export class CreatePageRelationDto {
  @ApiProperty({ description: 'ID de la página relacionada', example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  relatedPageId: number

  @ApiPropertyOptional({
    description: 'Score de similitud (0-1). Si es manual puede omitirse.',
    example: 0.81,
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(1)
  similarityScore?: number

  @ApiProperty({ enum: RelationType, example: RelationType.SEMANTIC })
  @IsEnum(RelationType)
  relationType: RelationType

  @ApiProperty({
    description: 'Texto exacto (verbatim) a enlazar dentro del bloque',
    example: 'respiración celular',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  mentionText: string

  @ApiPropertyOptional({
    description: 'Explicación opcional de la relación',
    example: 'Ambas páginas tratan la conversión de energía en células.',
  })
  @IsOptional()
  @IsString()
  explanation?: string

  @ApiPropertyOptional({
    description: 'Si ya se incrustó en el contenido (frontend)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isEmbedded?: boolean
}
