import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class EnrollmentDto {
  @ApiProperty({
    description: 'ID de la inscripción',
    example: 'clx1234567890',
  })
  id: string

  @ApiProperty({
    description: 'ID del usuario inscrito',
    example: 'clx0987654321',
  })
  userId: string

  @ApiProperty({
    description: 'ID del módulo',
    example: 'clx1122334455',
  })
  moduleId: string

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
