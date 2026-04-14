import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional } from 'class-validator'
import { BlockType } from 'src/core/database/generated/client'

const RETRYABLE_BLOCK_TYPES = [
  BlockType.SUMMARY,
  BlockType.FLASHCARDS,
  BlockType.QUIZ,
  BlockType.GLOSSARY,
] as const

export class RetryVideoContentDto {
  @ApiPropertyOptional({
    enum: RETRYABLE_BLOCK_TYPES,
    isArray: true,
    example: ['SUMMARY', 'QUIZ'],
  })
  @IsOptional()
  @IsEnum(BlockType, { each: true })
  contentTypes?: BlockType[]
}
