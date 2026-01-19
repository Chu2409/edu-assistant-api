import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class UpdatePageFeedbackDto {
  @ApiProperty({
    description: 'El contenido del feedback',
    example: 'Este es un feedback de prueba actualizado',
  })
  @IsString()
  @IsNotEmpty()
  feedback: string
}
