import { ApiProperty } from '@nestjs/swagger'
import { MessageDto } from './message.dto'

export class ChatMessageCreatedDto {
  @ApiProperty({ type: MessageDto })
  assistantMessage: MessageDto

  @ApiProperty({
    description:
      'ID de respuesta de OpenAI (para continuidad con previous_response_id)',
    example: 'resp_123',
  })
  responseId: string
}
