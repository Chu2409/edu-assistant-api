import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsOptional, Min } from 'class-validator'
import { BaseParamsReqDto } from 'src/shared/dtos/req/base-params.dto'

export class LoFiltersDto extends BaseParamsReqDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({
    description: 'Filtrar por ID de tipo de objeto de aprendizaje',
    example: 2,
  })
  typeId?: number
}
