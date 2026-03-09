import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, Max } from 'class-validator'
import { BaseParamsReqDto } from 'src/shared/dtos/req/base-params.dto'

export class UsersFiltersDto extends BaseParamsReqDto {
  @Type(() => Number)
  @IsInt()
  @Max(20)
  @ApiPropertyOptional({
    description: 'Number of records to return (max 20)',
    example: 20,
    required: false,
    default: 20,
  })
  limit: number = 20
}
