import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

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
