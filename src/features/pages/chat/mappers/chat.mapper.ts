import { MessageRole, Session } from 'src/core/database/generated/client'
import { SessionDto } from '../dtos/res/session.dto'
import { MessageDto } from '../dtos/res/message.dto'

export class ChatMapper {
  static toSessionDto(session: Session): SessionDto {
    return {
      id: session.id,
      pageId: session.pageId,
      userId: session.userId,
      title: session.title,
      startedAt: session.startedAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    }
  }

  static toMessageDto(message: {
    id: number
    sessionId: number
    role: MessageRole
    content: string
    metadata: string | null
    createdAt: Date
  }): MessageDto {
    return {
      id: message.id,
      sessionId: message.sessionId,
      role: message.role,
      content: message.content,
      metadata: message.metadata ?? null,
      createdAt: message.createdAt,
    }
  }
}
