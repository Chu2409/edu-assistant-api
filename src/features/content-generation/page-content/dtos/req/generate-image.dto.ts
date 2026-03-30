import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

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

  @ApiPropertyOptional({
    description: 'Idioma solicitado para el texto dentro de la imagen',
    example: 'Español',
  })
  @IsOptional()
  @IsString()
  language?: string
}
