import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsString, MaxLength, Min, MinLength } from 'class-validator'
import { IsYoutubeUrl } from '../../../validators/is-youtube-url.validator'

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
  @IsYoutubeUrl()
  url: string

  @ApiPropertyOptional({ example: 'auto', default: 'auto' })
  @IsString()
  outputLanguage: string = 'auto'
}
