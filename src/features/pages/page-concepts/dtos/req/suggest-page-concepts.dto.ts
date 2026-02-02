import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator'

export class SuggestPageConceptsDto {
  @ApiPropertyOptional({
    description:
      'IDs de bloques a analizar. Si no se envía, se usan todos los bloques TEXT de la página.',
    example: [10, 11],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  blockIds?: number[]

  @ApiPropertyOptional({
    description: 'Máximo de términos a extraer (calidad sobre cantidad)',
    example: 6,
    minimum: 1,
    maximum: 20,
    default: 6,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  maxTerms?: number

  @ApiPropertyOptional({
    description: 'Longitud máxima de definición (caracteres)',
    example: 120,
    minimum: 30,
    maximum: 800,
    default: 120,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(30)
  @Max(800)
  maxDefinitionLength?: number
}
