import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator'
import { RelationType } from 'src/core/database/generated/enums'

export class UpdatePageRelationDto {
  @ApiPropertyOptional({
    description: 'Score de similitud (0-1)',
    example: 0.81,
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(1)
  similarityScore?: number

  @ApiPropertyOptional({ enum: RelationType })
  @IsOptional()
  @IsEnum(RelationType)
  relationType?: RelationType

  @ApiPropertyOptional({
    description: 'Texto exacto (verbatim) a enlazar dentro del bloque',
    example: 'respiración celular',
    minLength: 1,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  mentionText?: string

  @ApiPropertyOptional({
    description: 'Explicación opcional',
    example: 'Esta página complementa con un ejemplo aplicado.',
  })
  @IsOptional()
  @IsString()
  explanation?: string | null

  @ApiPropertyOptional({
    description: 'Marcado como incrustado',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isEmbedded?: boolean
}
