import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { NotificationType } from 'src/core/database/generated/client'

export class NotificationDto {
  @ApiProperty({ description: 'ID de la notificación', example: 1 })
  id: number

  @ApiProperty({
    description: 'Tipo de notificación',
    enum: NotificationType,
    example: 'NEW_PAGE',
  })
  type: NotificationType

  @ApiProperty({
    description: 'Título de la notificación',
    example: 'Nueva página añadida',
  })
  title: string

  @ApiProperty({
    description: 'Mensaje detallado',
    example: 'Se ha publicado una nueva lección: "Introducción a NestJS"',
  })
  message: string

  @ApiPropertyOptional({
    description: 'ID de la entidad relacionada (LO, Módulo, etc.)',
    example: 123,
  })
  relatedEntityId?: number

  @ApiPropertyOptional({
    description: 'Tipo de la entidad relacionada',
    example: 'LearningObject',
  })
  relatedEntityType?: string

  @ApiProperty({ description: 'Indica si ha sido leída', example: false })
  isRead: boolean

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date
}
