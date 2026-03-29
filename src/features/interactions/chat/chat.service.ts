import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { OpenaiService } from 'src/providers/ai/services/openai.service'
import { PagesHelperService } from 'src/features/pages/main/pages-helper.service'
import {
  Block,
  MessageRole,
  type User,
} from 'src/core/database/generated/client'
import { BlockType } from 'src/core/database/generated/enums'
import { CreateOrGetSessionDto } from './dtos/req/create-or-get-session.dto'
import { SendMessageDto } from './dtos/req/send-message.dto'
import { SessionDto } from './dtos/res/session.dto'
import { MessageDto } from './dtos/res/message.dto'
import { ChatMessageCreatedDto } from './dtos/res/chat-message-created.dto'
import {
  AiCodeBlock,
  AiTextBlock,
} from '../../content-generation/shared/interfaces/ai-generated-content.interface'
import { parseJsonField } from 'src/providers/ai/helpers/utils'
import { chatSessionPrompt } from './prompts/chat-session.prompt'
import { ChatMapper } from './mappers/chat.mapper'
import { BlocksMapper } from 'src/features/pages/blocks/mappers/blocks.mapper'

type StoredAiMetadata = {
  responseId?: string
}

@Injectable()
export class ChatService {
  constructor(
    private readonly dbService: DBService,
    private readonly openAiService: OpenaiService,
    private readonly pagesHelperService: PagesHelperService,
  ) {}

  async createOrGetSession(
    pageId: number,
    dto: CreateOrGetSessionDto,
    user: User,
  ): Promise<SessionDto> {
    const page = await this.pagesHelperService.getPageForRead(pageId, user)

    const existing = await this.dbService.session.findUnique({
      where: { userId_pageId: { userId: user.id, pageId } },
    })
    if (existing) {
      return ChatMapper.toSessionDto(existing)
    }

    const created = await this.dbService.session.create({
      data: {
        pageId,
        userId: user.id,
        title: dto.title ?? `Chat: ${page.title}`,
      },
    })

    return ChatMapper.toSessionDto(created)
  }

  async listMessages(sessionId: number, user: User): Promise<MessageDto[]> {
    const session = await this.dbService.session.findUnique({
      where: { id: sessionId },
      include: {
        page: { include: { module: { include: { enrollments: true } } } },
      },
    })

    if (!session) {
      throw new NotFoundException('Sesión no encontrada')
    }

    if (session.userId !== user.id) {
      throw new ForbiddenException('No tienes permisos para ver esta sesión')
    }

    // valida acceso a la página (por si cambió publicación/matrícula)
    await this.pagesHelperService.getPageForRead(session.pageId, user)

    const messages = await this.dbService.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    })

    return messages.map((m) =>
      ChatMapper.toMessageDto({
        id: m.id,
        sessionId: m.sessionId,
        role: m.role,
        content: m.content,
        metadata: m.metadata ?? null,
        createdAt: m.createdAt,
      }),
    )
  }

  async sendMessage(
    sessionId: number,
    dto: SendMessageDto,
    user: User,
  ): Promise<ChatMessageCreatedDto> {
    const session = await this.dbService.session.findUnique({
      where: { id: sessionId },
      include: {
        page: {
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
      session.pageId,
      user,
    )

    const previousResponseId = this.getPreviousResponseId(session.messages)

    const isFirstMessage = !previousResponseId
    const lessonContext = isFirstMessage
      ? this.buildLessonContext(session.page.blocks)
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

  private buildLessonContext(blocks: Block[]): string {
    const mapped = blocks.map((b) => BlocksMapper.mapToDto(b))

    const parts: string[] = []

    for (const block of mapped) {
      if (block.type === BlockType.TEXT) {
        const markdown = String((block.content as AiTextBlock).markdown || '')
        if (markdown.trim()) {
          parts.push(markdown.trim())
        }
      } else if (block.type === BlockType.CODE) {
        const lang = String((block.content as AiCodeBlock).language)
        const code = String((block.content as AiCodeBlock).code)
        const codeTrim = String(code).trim()
        if (codeTrim) {
          parts.push(`Código (${lang || 'code'}):\n${codeTrim}`)
        }
      }
    }

    return parts.join('\n\n---\n\n')
  }
}
