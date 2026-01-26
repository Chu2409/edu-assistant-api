import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsInt, MinLength, Min } from 'class-validator'
import { Type } from 'class-transformer'

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
