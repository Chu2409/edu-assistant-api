import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsNumber, IsString } from 'class-validator'

export class CreatePageNoteDto {
  @ApiProperty({
    description: 'El ID de la página a la que pertenece la nota',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  pageId: number

  @ApiProperty({
    description: 'El contenido de la nota',
    example: 'Este es el contenido de la nota.',
  })
  @IsString()
  @IsNotEmpty()
  content: string
}
