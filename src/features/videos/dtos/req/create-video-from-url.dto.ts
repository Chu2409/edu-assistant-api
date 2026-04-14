import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsInt,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator'

export class CreateVideoFromUrlDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  moduleId: number

  @ApiProperty({ example: 'Introduction to Algorithms' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string

  @ApiProperty({ example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
  @IsString()
  @IsUrl()
  url: string

  @ApiPropertyOptional({ example: 'auto', default: 'auto' })
  @IsString()
  outputLanguage: string = 'auto'
}
