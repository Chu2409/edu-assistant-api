import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional } from 'class-validator'
import { IngestionStatus } from 'src/core/database/generated/client'
import { BaseParamsReqDto } from 'src/shared/dtos/req/base-params.dto'

export class VideoFiltersDto extends BaseParamsReqDto {
  @ApiPropertyOptional({ enum: IngestionStatus })
  @IsOptional()
  @IsEnum(IngestionStatus)
  status?: IngestionStatus
}
