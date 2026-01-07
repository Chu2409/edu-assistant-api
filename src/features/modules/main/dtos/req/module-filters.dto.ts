import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsBoolean, IsOptional, IsString } from 'class-validator'
import { BaseParamsReqDto } from 'src/shared/dtos/req/base-params.dto'

export class ModuleFiltersDto extends BaseParamsReqDto {
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
  @Type(() => String)
  @IsString({ each: true })
  teacherId?: string | string[]
}
