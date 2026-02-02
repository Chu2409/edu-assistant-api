import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator'

export class RefreshPageEmbeddingDto {
  @ApiPropertyOptional({
    description:
      'Si true, fuerza recalcular aunque ya exista embedding en DB (recomendado tras cambios grandes).',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean

  @ApiPropertyOptional({
    description:
      'IDs de bloques para compilar el contenido (opcional). Si no se envía, usa todos los bloques de la página.',
    example: [10, 11],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  blockIds?: number[]
}
