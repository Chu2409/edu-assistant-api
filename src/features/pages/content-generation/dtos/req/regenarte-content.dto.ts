import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsInt, MinLength, Min } from 'class-validator'

export class RegenerateContentDto {
  @ApiProperty({
    description: 'Instrucciones para regenerar el contenido de la página',
    example: 'Haz el contenido más detallado y agrega más ejemplos prácticos',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  instruction: string

  @ApiProperty({
    description: 'ID de la página a regenerar',
    example: 1,
  })
  @IsInt()
  @Min(1)
  pageId: number
}
