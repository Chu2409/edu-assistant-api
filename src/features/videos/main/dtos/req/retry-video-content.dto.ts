import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional } from 'class-validator'
import { BlockType } from 'src/core/database/generated/client'
import { GENERATED_BLOCK_TYPES } from '../../../constants/video.constants'

export class RetryVideoContentDto {
  @ApiPropertyOptional({
    enum: GENERATED_BLOCK_TYPES,
    isArray: true,
    example: ['SUMMARY', 'QUIZ'],
  })
  @IsOptional()
  @IsEnum(BlockType, { each: true })
  contentTypes?: BlockType[]
}
