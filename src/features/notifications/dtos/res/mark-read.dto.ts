import { ApiProperty } from '@nestjs/swagger'

export class MarkReadResponseDto {
  @ApiProperty({
    description: 'Indica si la operación fue exitosa',
    example: true,
  })
  success: boolean

  @ApiProperty({
    description: 'ID de la notificación marcada como leída',
    example: 123,
  })
  notificationId: number
}
