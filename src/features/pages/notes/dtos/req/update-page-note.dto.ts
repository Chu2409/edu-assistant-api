import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class UpdatePageNoteDto {
  @ApiProperty({
    description: 'El contenido de la nota',
    example: 'Este es el contenido actualizado de la nota.',
  })
  @IsString()
  @IsNotEmpty()
  content: string
}
