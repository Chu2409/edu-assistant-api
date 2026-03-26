import { ApiProperty } from '@nestjs/swagger'
import { IsString, MaxLength, MinLength } from 'class-validator'

export class GenerateImageDto {
  @ApiProperty({
    description: 'Prompt para generar la imagen',
    example: 'A labeled diagram of the mitochondrion, clean vector style',
    minLength: 5,
    maxLength: 2000,
  })
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  prompt: string
}
