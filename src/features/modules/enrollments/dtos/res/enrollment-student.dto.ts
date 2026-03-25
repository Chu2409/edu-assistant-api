import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { UserDto } from 'src/features/users/dtos/res/user.dto'

export class EnrollmentStudentsDto {
  @ApiProperty({
    description: 'ID de la inscripción',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: 'Usuario inscrito',
    type: UserDto,
  })
  user: UserDto

  @ApiProperty({
    description: 'Fecha de inscripción',
    example: '2024-01-01T00:00:00.000Z',
  })
  enrolledAt: Date

  @ApiPropertyOptional({
    description: 'Fecha de finalización del módulo',
    example: '2024-12-31T23:59:59.000Z',
    nullable: true,
  })
  completedAt: Date | null

  @ApiProperty({
    description: 'Indica si la inscripción está activa',
    example: true,
  })
  isActive: boolean
}
