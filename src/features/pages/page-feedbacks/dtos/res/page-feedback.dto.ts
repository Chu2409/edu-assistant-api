import { ApiProperty } from '@nestjs/swagger'
import { UserDto } from 'src/features/users/dtos/res/user.dto'

export class PageFeedbackDto {
  @ApiProperty({
    description: 'ID de la reseña',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: 'Usuario que hizo la reseña',
    type: UserDto,
  })
  user: UserDto

  @ApiProperty({
    description: 'Reseña de la página',
    example: 'La página es muy buena',
  })
  feedback: string

  @ApiProperty({
    description: 'Fecha de creación de la reseña',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date

  @ApiProperty({
    description: 'Fecha de última actualización de la reseña',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date
}
