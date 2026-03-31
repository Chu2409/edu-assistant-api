import { ApiProperty } from '@nestjs/swagger'
import { UserDto } from 'src/features/users/dtos/res/user.dto'

export class StudentQuestionDto {
  @ApiProperty({
    description: 'ID de la pregunta',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: 'Usuario que hizo la pregunta',
    type: UserDto,
  })
  user: UserDto

  @ApiProperty({
    description: 'ID de la página a la que pertenece la pregunta',
    example: 1,
  })
  pageId: number

  @ApiProperty({
    description: 'Pregunta del estudiante',
    example: '¿Qué es la programación?',
  })
  question: string

  @ApiProperty({
    description: 'Indica si la pregunta es pública',
    example: true,
  })
  isPublic: boolean

  @ApiProperty({
    description: 'Número de votos de la pregunta',
    example: 10,
  })
  upvotes: number

  @ApiProperty({
    description: 'Fecha de creación de la pregunta',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date

  @ApiProperty({
    description: 'Fecha de última actualización de la pregunta',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date
}
