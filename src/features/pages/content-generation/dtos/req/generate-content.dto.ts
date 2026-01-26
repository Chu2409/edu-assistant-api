import { ApiProperty } from '@nestjs/swagger'
import { IsString, MinLength } from 'class-validator'

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
}
