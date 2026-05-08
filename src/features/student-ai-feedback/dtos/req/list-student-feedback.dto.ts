import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'
import { BaseParamsReqDto } from 'src/shared/dtos/req/base-params.dto'

export class ListStudentFeedbackDto extends BaseParamsReqDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Filtrar por scope',
    example: 'WEEKLY_DIGEST',
  })
  scope?: string
}
