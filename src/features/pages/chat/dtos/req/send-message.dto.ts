import { ApiProperty } from '@nestjs/swagger'
import { IsString, MaxLength, MinLength } from 'class-validator'

export class SendMessageDto {
  @ApiProperty({
    description: 'Mensaje del usuario',
    example: '¿Puedes explicarme este concepto con un ejemplo?',
    minLength: 1,
    maxLength: 2000,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message: string
}
