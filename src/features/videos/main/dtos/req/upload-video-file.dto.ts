import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsString, MaxLength, Min, MinLength } from 'class-validator'

export class UploadVideoFileDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  moduleId: number

  @ApiProperty({ example: 'Video Lecture on Data Structures' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string

  @ApiPropertyOptional({ example: 'auto', default: 'auto' })
  @IsString()
  outputLanguage: string = 'auto'
}
