import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class UpdateQuestionReplyDto {
  @ApiProperty({
    description: 'El texto de la respuesta',
    example:
      'La programación es el proceso de crear software usando lenguajes de programación...',
    required: false,
  })
  @IsString()
  @IsOptional()
  replyText?: string
}
