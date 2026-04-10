import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsNumber, IsString } from 'class-validator'

export class CreateLoNoteDto {
  @ApiProperty({
    description: 'El ID del objeto de aprendizaje al que pertenece la nota',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  learningObjectId: number

  @ApiProperty({
    description: 'El contenido de la nota',
    example: 'Este es el contenido de la nota.',
  })
  @IsString()
  @IsNotEmpty()
  content: string
}
