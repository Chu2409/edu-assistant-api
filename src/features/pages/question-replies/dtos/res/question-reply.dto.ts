import { ApiProperty } from '@nestjs/swagger'
import { UserDto } from 'src/features/users/dtos/res/user.dto'

export class QuestionReplyDto {
  @ApiProperty({
    description: 'ID de la respuesta',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: 'ID de la pregunta a la que pertenece la respuesta',
    example: 1,
  })
  questionId: number

  @ApiProperty({
    description: 'Usuario que hizo la respuesta',
    type: UserDto,
  })
  user: UserDto

  @ApiProperty({
    description: 'Texto de la respuesta',
    example: 'La programación es el proceso de crear software...',
  })
  replyText: string

  @ApiProperty({
    description: 'Indica si la respuesta es de un profesor',
    example: false,
  })
  isFromTeacher: boolean

  @ApiProperty({
    description: 'Fecha de creación de la respuesta',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date
}
