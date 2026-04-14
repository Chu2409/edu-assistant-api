import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional } from 'class-validator'
import { BaseParamsReqDto } from 'src/shared/dtos/req/base-params.dto'

export enum TeacherFeedbackScopeFilter {
  LEARNING_OBJECT = 'LEARNING_OBJECT',
  MODULE = 'MODULE',
}

export class ListTeacherFeedbackDto extends BaseParamsReqDto {
  @IsOptional()
  @IsEnum(TeacherFeedbackScopeFilter)
  @ApiPropertyOptional({
    description: 'Filtrar por scope',
    enum: TeacherFeedbackScopeFilter,
  })
  scope?: TeacherFeedbackScopeFilter
}
