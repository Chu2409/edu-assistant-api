import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsInt, MinLength, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class GenerateContentDto {
  @ApiProperty({
    description: 'ID del módulo para el cual se generará el contenido',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  moduleId: number

  @ApiProperty({
    description: 'Tema o tópico del contenido a generar',
    example: 'Fotosíntesis',
    minLength: 2,
    maxLength: 200,
  })
  @IsString()
  @MinLength(2)
  topic: string

  @ApiProperty({
    description: 'Prompt para la generación del contenido',
    example:
      'Genera un contenido sobre la fotosíntesis para estudiantes de primer año de secundaria',
  })
  @IsString()
  @MinLength(5)
  prompt: string
}
