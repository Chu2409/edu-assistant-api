import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { OpenaiService } from 'src/providers/ai/openai.service'
import {
  Enrollment,
  MessageRole,
  Role,
  type Page,
  type Session,
  type User,
} from 'src/core/database/generated/client'
import { BlocksMapper } from '../blocks/mappers/blocks.mapper'
import { BlockType } from 'src/core/database/generated/enums'
import type { AiTextBlock } from '../content-generation/interfaces/ai-generated-content.interface'
import type { PromptInput } from '../content-generation/interfaces/prompt-input.interface'
import { CreateOrGetSessionDto } from './dtos/req/create-or-get-session.dto'
import { SendMessageDto } from './dtos/req/send-message.dto'
import { SessionDto } from './dtos/res/session.dto'
import { MessageDto } from './dtos/res/message.dto'
import { ChatMessageCreatedDto } from './dtos/res/chat-message-created.dto'

type StoredAiMetadata = {
  responseId?: string
}

@Injectable()
export class ChatService {
  constructor(
    private readonly dbService: DBService,
    private readonly openAiService: OpenaiService,
  ) {}

  private async getPageForAccess(pageId: number, user: User): Promise<Page> {
    const page = await this.dbService.page.findUnique({
      where: { id: pageId },
      include: {
        module: { include: { enrollments: true, aiConfiguration: true } },
      },
    })

    if (!page) {
      throw new NotFoundException(`Página con ID ${pageId} no encontrada`)
    }

    if (user.role === Role.ADMIN) {
      return page
    }

    if (user.role === Role.TEACHER) {
      if (page.module.teacherId !== user.id) {
        throw new ForbiddenException(
          'No tienes permisos para acceder a esta página',
        )
      }
      return page
    }

    const hasAccess =
      page.module.isPublic ||
      page.module.enrollments.some(
        (enrollment: Enrollment) =>
          enrollment.userId === user.id && enrollment.isActive,
      )

    if (!hasAccess) {
      throw new ForbiddenException(
        'No tienes permisos para acceder a esta página',
      )
    }
    if (!page.isPublished) {
      throw new ForbiddenException('Esta página no está publicada aún')
    }

    return page
  }

  private toSessionDto(session: Session): SessionDto {
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

  private toMessageDto(message: {
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

  async createOrGetSession(
    pageId: number,
    dto: CreateOrGetSessionDto,
    user: User,
  ): Promise<SessionDto> {
    const page = await this.getPageForAccess(pageId, user)

    const existing = await this.dbService.session.findUnique({
      where: { userId_pageId: { userId: user.id, pageId } },
    })
    if (existing) {
      return this.toSessionDto(existing)
    }

    const created = await this.dbService.session.create({
      data: {
        pageId,
        userId: user.id,
        title: dto.title ?? `Chat: ${page.title}`,
      },
    })

    return this.toSessionDto(created)
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
    await this.getPageForAccess(session.pageId, user)

    const messages = await this.dbService.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    })

    return messages.map((m) =>
      this.toMessageDto({
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

    const page = await this.getPageForAccess(session.pageId, user)

    const previousResponseId = this.getPreviousResponseId(session.messages)

    const lessonContext = this.buildLessonContext(session.page.blocks)
    // @ts-ignore
    const language = page?.module.aiConfiguration?.language ?? 'es'

    const prompt = this.buildChatPrompt({
      language,
      lessonTitle: page.title,
      lessonContext,
      userMessage: dto.message,
    })

    const ai = await this.openAiService.getResponse<{ answer: string }>(
      prompt,
      previousResponseId,
    )

    const responseId = ai.responseId
    const assistantAnswer = ai.content.answer

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
      assistantMessage: this.toMessageDto({
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
      const parsed = JSON.parse(assistant.metadata) as StoredAiMetadata
      return parsed.responseId
    } catch {
      return undefined
    }
  }

  private buildLessonContext(blocks: any[]): string {
    const mapped = blocks.map((b) => BlocksMapper.mapToDto(b))

    const parts: string[] = []

    for (const block of mapped) {
      if (block.type === BlockType.TEXT) {
        const markdown = String((block.content as any).markdown || '')
        if (markdown.trim()) {
          parts.push(markdown.trim())
        }
      } else if (block.type === BlockType.CODE) {
        const lang = String((block.content as any).language ?? '')
        const code = String((block.content as any).code ?? '')
        const codeTrim = String(code).trim()
        if (codeTrim) {
          parts.push(`Código (${lang || 'code'}):\n${codeTrim}`)
        }
      }
    }

    return parts.join('\n\n---\n\n')
  }

  private buildChatPrompt(input: {
    language: string
    lessonTitle: string
    lessonContext: string
    userMessage: string
  }): PromptInput[] {
    const { language, lessonTitle, lessonContext, userMessage } = input

    const system = `Eres un asistente educativo. Tu objetivo es ayudar al estudiante usando EXCLUSIVAMENTE el contenido de la lección y conocimiento general básico para explicar, pero sin inventar detalles específicos que no estén en la lección.

Responde en el idioma: ${language}.

# FORMATO DE SALIDA (OBLIGATORIO)
Devuelve SOLO JSON válido (sin fences, sin texto extra):
{ "answer": string }

# REGLAS
- Si el usuario pide algo que NO está en la lección y no puede inferirse, dilo claramente y sugiere qué parte falta.
- Respuestas claras, paso a paso si aplica.
- Si hay código, explica qué hace y muestra un ejemplo corto si ayuda.`

    const user = `Lección: ${lessonTitle}

# CONTEXTO DE LA LECCIÓN
${lessonContext || '(sin contenido disponible)'}

# PREGUNTA DEL USUARIO
${userMessage}`

    return [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ]
  }
}
