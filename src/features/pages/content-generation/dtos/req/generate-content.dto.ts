import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class GenerateContentDto {
  @ApiProperty({
    description: 'Tema o tópico del contenido a generar',
    example: 'Programación Orientada a Objetos en Java',
    minLength: 2,
    maxLength: 200,
  })
  @IsString()
  @MinLength(2)
  title: string

  @ApiPropertyOptional({
    description:
      'Instrucciones específicas del profesor para la generación del contenido',
    example:
      'Enfócate en ejemplos prácticos de programación orientada a objetos',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instructions?: string
}
