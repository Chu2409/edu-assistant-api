import { ApiProperty } from '@nestjs/swagger'

export class AiResponseDto<T> {
  @ApiProperty({
    description: 'Contenido de la respuesta',
    type: Object,
  })
  content: T

  @ApiProperty({
    description: 'ID de la respuesta',
    type: String,
  })
  responseId: string
}
