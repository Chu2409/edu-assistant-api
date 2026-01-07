import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsBoolean, IsInt, IsOptional } from 'class-validator'
import { BaseParamsReqDto } from 'src/shared/dtos/req/base-params.dto'

export class ModulesAllFiltersDto extends BaseParamsReqDto {
  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: 'Is public',
    example: true,
    required: false,
  })
  @Type(() => Boolean)
  isPublic?: boolean

  @IsOptional()
  @Type(() => Number)
  @IsInt({ each: true })
  teacherId?: number | number[]
}

export class ModulesAvailableFiltersDto extends BaseParamsReqDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ each: true })
  teacherId?: number | number[]
}
