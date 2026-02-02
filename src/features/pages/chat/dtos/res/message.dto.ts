import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { MessageRole } from 'src/core/database/generated/enums'

export class MessageDto {
  @ApiProperty({ example: 1 })
  id: number

  @ApiProperty({ example: 1 })
  sessionId: number

  @ApiProperty({ enum: MessageRole, example: MessageRole.user })
  role: MessageRole

  @ApiProperty({
    example: 'Claro. Una variable es...',
  })
  content: string

  @ApiPropertyOptional({
    description: 'Metadatos JSON serializados (opcional)',
    example: '{"responseId":"resp_123"}',
  })
  metadata: string | null

  @ApiProperty()
  createdAt: Date
}
