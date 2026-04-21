import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator'
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

  @ApiPropertyOptional({
    description:
      'Optional teacher feedback to steer AI regeneration (e.g. "use a more formal tone", "add 5 more flashcards on pronunciation"). If omitted, classic retry behavior applies.',
    example: 'Rewrite the summary in a more formal academic tone.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instruction?: string
}
