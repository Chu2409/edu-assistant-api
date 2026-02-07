import { ApiProperty } from '@nestjs/swagger'
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator'

export class CreateQuestionReplyDto {
  @ApiProperty({
    description: 'El ID de la pregunta a la que pertenece la respuesta',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  questionId: number

  @ApiProperty({
    description: 'El texto de la respuesta',
    example: 'La programación es el proceso de crear software...',
  })
  @IsString()
  @IsNotEmpty()
  replyText: string
}
