import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsNumber, IsString } from 'class-validator'

export class CreateLoFeedbackDto {
  @ApiProperty({
    description: 'El ID del objeto de aprendizaje al que pertenece el feedback',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  learningObjectId: number

  @ApiProperty({
    description: 'El contenido del feedback',
    example: 'Este es un feedback de prueba',
  })
  @IsString()
  @IsNotEmpty()
  feedback: string
}
