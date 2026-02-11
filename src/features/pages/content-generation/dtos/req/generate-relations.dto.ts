import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, Max, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class GenerateRelationsDto {
  @ApiProperty({
    description: 'ID de la página para la cual generar relaciones',
    example: 1,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageId: number

  @ApiPropertyOptional({
    description: 'Cantidad máxima de páginas candidatas similares a considerar',
    example: 10,
    default: 10,
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
      'Similitud mínima (0-1) para considerar una página candidata. 1 = idéntica, 0.5 = moderada.',
    example: 0.5,
    default: 0.5,
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(1)
  minSimilarity?: number

  @ApiPropertyOptional({
    description: 'Máximo de relaciones a generar por página',
    example: 5,
    default: 5,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  maxRelationsPerPage?: number
}
