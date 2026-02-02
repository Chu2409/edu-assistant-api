import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator'
import { RelationType } from 'src/core/database/generated/enums'

export class SuggestPageRelationsDto {
  @ApiPropertyOptional({
    description: 'Cantidad máxima de páginas relacionadas a sugerir',
    example: 5,
    default: 5,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  topK?: number

  @ApiPropertyOptional({
    description:
      'Score mínimo (0-1) para considerar una relación (basado en similitud)',
    example: 0.72,
    default: 0.7,
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(1)
  minScore?: number

  @ApiPropertyOptional({
    description: 'Filtrar tipos de relación permitidos (opcional)',
    enum: RelationType,
    isArray: true,
    example: [RelationType.SEMANTIC, RelationType.COMPLEMENTARY],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(RelationType, { each: true })
  relationTypes?: RelationType[]

  @ApiPropertyOptional({
    description:
      'IDs de bloques para acotar dónde buscar el mentionText. Si no se envía, se usan todos los bloques TEXT de la página.',
    example: [10, 11],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  scopeBlockIds?: number[]
}
