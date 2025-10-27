import { IsOptional, IsString } from 'class-validator'
import { BaseParamsReqDto } from 'src/common/dtos/req/base-params.dto'

export class UserFiltersReqDto extends BaseParamsReqDto {
  @IsOptional()
  @IsString()
  search?: string
}
