import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { OpenaiService } from 'src/providers/ai/services/openai.service'
import { LoHelperService } from 'src/features/learning-objects/main/lo-helper.service'
import { MessageRole, type User } from 'src/core/database/generated/client'
import { CreateOrGetSessionDto } from './dtos/req/create-or-get-session.dto'
import { SendMessageDto } from './dtos/req/send-message.dto'
import { SessionDto } from './dtos/res/session.dto'
import { MessageDto } from './dtos/res/message.dto'
import { ApiPaginatedRes } from 'src/shared/dtos/res/api-response.dto'
import { ChatMessageCreatedDto } from './dtos/res/chat-message-created.dto'
import { parseJsonField } from 'src/providers/ai/helpers/utils'
import { chatSessionPrompt } from './prompts/chat-session.prompt'
import { ChatMapper } from './mappers/chat.mapper'
import { compileBlocksToText } from 'src/features/learning-objects/blocks/helpers/compile-blocks'
import { BaseParamsReqDto } from 'src/shared/dtos/req/base-params.dto'

type StoredAiMetadata = {
  responseId?: string
}

@Injectable()
export class ChatService {
  constructor(
    private readonly dbService: DBService,
    private readonly openAiService: OpenaiService,
    private readonly pagesHelperService: LoHelperService,
  ) {}

  async createOrGetSession(
    pageId: number,
    dto: CreateOrGetSessionDto,
    user: User,
  ): Promise<SessionDto> {
    const page = await this.pagesHelperService.getPageForRead(pageId, user)

    const existing = await this.dbService.session.findUnique({
      where: {
        userId_learningObjectId: { userId: user.id, learningObjectId: pageId },
      },
    })
    if (existing) {
      return ChatMapper.toSessionDto(existing)
    }

    const created = await this.dbService.session.create({
      data: {
        learningObjectId: pageId,
        userId: user.id,
        title: dto.title ?? `Chat: ${page.title}`,
      },
    })

    return ChatMapper.toSessionDto(created)
  }

  async listMessages(
    sessionId: number,
    query: BaseParamsReqDto,
    user: User,
  ): Promise<ApiPaginatedRes<MessageDto>> {
    const session = await this.dbService.session.findUnique({
      where: { id: sessionId },
      include: {
        learningObject: {
          include: { module: { include: { enrollments: true } } },
        },
      },
    })

    if (!session) {
      throw new NotFoundException('Sesión no encontrada')
    }

    if (session.userId !== user.id) {
      throw new ForbiddenException('No tienes permisos para ver esta sesión')
    }

    // valida acceso a la página (por si cambió publicación/matrícula)
    await this.pagesHelperService.getPageForRead(session.learningObjectId, user)

    const skip = (query.page - 1) * query.limit

    const [total, messages] = await Promise.all([
      this.dbService.message.count({ where: { sessionId } }),
      this.dbService.message.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' }, // Traemos los más recientes primero
        skip,
        take: query.limit,
      }),
    ])

    // Invertimos el arreglo de mensajes para que quede en orden cronológico (asc) para el frontend
    const sortedMessages = messages.reverse()

    const records = sortedMessages.map((m) =>
      ChatMapper.toMessageDto({
        id: m.id,
        sessionId: m.sessionId,
        role: m.role,
        content: m.content,
        metadata: m.metadata ?? null,
        createdAt: m.createdAt,
      }),
    )

    return {
      records,
      total,
      limit: query.limit,
      page: query.page,
      pages: Math.ceil(total / query.limit),
    }
  }

  async sendMessage(
    sessionId: number,
    dto: SendMessageDto,
    user: User,
  ): Promise<ChatMessageCreatedDto> {
    const session = await this.dbService.session.findUnique({
      where: { id: sessionId },
      include: {
        learningObject: {
          include: {
            blocks: true,
            module: { include: { enrollments: true, aiConfiguration: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!session) {
      throw new NotFoundException('Sesión no encontrada')
    }

    if (session.userId !== user.id) {
      throw new ForbiddenException('No tienes permisos para usar esta sesión')
    }

    const page = await this.pagesHelperService.getPageForRead(
      session.learningObjectId,
      user,
    )

    const previousResponseId = this.getPreviousResponseId(session.messages)

    const isFirstMessage = !previousResponseId
    const lessonContext = isFirstMessage
      ? compileBlocksToText(session.learningObject.blocks)
      : undefined

    const language = page.module.aiConfiguration?.language ?? 'es'

    const prompt = chatSessionPrompt({
      language,
      lessonTitle: page.title,
      lessonContext,
      userMessage: dto.message,
      isFirstMessage,
    })

    const ai = await this.openAiService.getMarkdownResponse(
      prompt,
      previousResponseId,
    )

    const responseId = ai.responseId
    const assistantAnswer = ai.content

    const assistantMetadata: StoredAiMetadata = { responseId }

    const { assistantMessage } = await this.dbService.$transaction(
      async (prisma) => {
        await prisma.message.create({
          data: {
            sessionId,
            role: MessageRole.user,
            content: dto.message,
          },
        })

        const createdAssistant = await prisma.message.create({
          data: {
            sessionId,
            role: MessageRole.assistant,
            content: assistantAnswer,
            metadata: JSON.stringify(assistantMetadata),
          },
        })

        return { assistantMessage: createdAssistant }
      },
    )

    return {
      assistantMessage: ChatMapper.toMessageDto({
        id: assistantMessage.id,
        sessionId: assistantMessage.sessionId,
        role: assistantMessage.role,
        content: assistantMessage.content,
        metadata: assistantMessage.metadata ?? null,
        createdAt: assistantMessage.createdAt,
      }),
      responseId,
    }
  }

  private getPreviousResponseId(
    latestMessages: Array<{ role: MessageRole; metadata: string | null }>,
  ): string | undefined {
    const assistant = latestMessages.find(
      (m) => m.role === MessageRole.assistant,
    )
    if (!assistant?.metadata) return undefined

    try {
      const parsed = parseJsonField<StoredAiMetadata>(assistant.metadata)
      return parsed.responseId
    } catch {
      return undefined
    }
  }
}
