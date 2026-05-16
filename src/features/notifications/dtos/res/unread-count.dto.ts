import { ApiProperty } from '@nestjs/swagger'

export class UnreadCountDto {
  @ApiProperty({
    description: 'Cantidad de notificaciones no leídas',
    example: 5,
  })
  count: number
}
