import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { OpenaiService } from 'src/providers/ai/openai.service'
import {
  Activity,
  Enrollment,
  Prisma,
  Role,
  type User,
} from 'src/core/database/generated/client'
import { BlockType, type ActivityType } from 'src/core/database/generated/enums'
import { BlocksMapper } from '../blocks/mappers/blocks.mapper'
import { CreateActivityDto } from './dtos/req/create-activity.dto'
import { UpdateActivityDto } from './dtos/req/update-activity.dto'
import { CreateActivityAttemptDto } from './dtos/req/create-activity-attempt.dto'
import { ActivityDto } from './dtos/res/activity.dto'
import { ActivityAttemptDto } from './dtos/res/activity-attempt.dto'

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly dbService: DBService,
    private readonly openAiService: OpenaiService,
  ) {}

  private async getPageForRead(pageId: number, user: User) {
    const page = await this.dbService.page.findUnique({
      where: { id: pageId },
      include: {
        module: { include: { enrollments: true, aiConfiguration: true } },
      },
    })

    if (!page) {
      throw new NotFoundException(`Página con ID ${pageId} no encontrada`)
    }

    if (user.role === Role.ADMIN) return page

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

  private async getPageForWrite(pageId: number, user: User) {
    const page = await this.dbService.page.findUnique({
      where: { id: pageId },
      include: { module: true },
    })

    if (!page) {
      throw new NotFoundException(`Página con ID ${pageId} no encontrada`)
    }

    if (user.role === Role.ADMIN) return page

    if (page.module.teacherId !== user.id) {
      throw new ForbiddenException(
        'Solo el profesor propietario puede modificar actividades de esta página',
      )
    }

    return page
  }

  private toDto(activity: Activity): ActivityDto {
    return {
      id: activity.id,
      pageId: activity.pageId,
      type: activity.type as any,
      question: activity.question,
      options:
        (activity.options as any) === null
          ? null
          : typeof activity.options === 'string'
            ? JSON.parse(activity.options)
            : (activity.options as any),
      correctAnswer:
        typeof activity.correctAnswer === 'string'
          ? JSON.parse(activity.correctAnswer)
          : (activity.correctAnswer as any),
      explanation: activity.explanation ?? null,
      difficulty: activity.difficulty,
      orderIndex: activity.orderIndex,
      isApprovedByTeacher: activity.isApprovedByTeacher,
      usedAsExample: activity.usedAsExample,
      generatedFromId: activity.generatedFromId ?? null,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
    }
  }

  async list(pageId: number, user: User): Promise<ActivityDto[]> {
    await this.getPageForRead(pageId, user)
    const activities = await this.dbService.activity.findMany({
      where: { pageId },
      orderBy: { orderIndex: 'asc' },
    })
    return activities.map((a) => this.toDto(a))
  }

  async create(
    pageId: number,
    dto: CreateActivityDto,
    user: User,
  ): Promise<ActivityDto> {
    await this.getPageForWrite(pageId, user)

    const last = await this.dbService.activity.findFirst({
      where: { pageId },
      orderBy: { orderIndex: 'desc' },
    })

    const created = await this.dbService.activity.create({
      data: {
        pageId,
        type: dto.type,
        question: dto.question,
        options:
          dto.options === undefined
            ? Prisma.JsonNull
            : (dto.options ?? Prisma.JsonNull),
        correctAnswer: dto.correctAnswer,
        explanation: dto.explanation ?? null,
        difficulty: dto.difficulty ?? 1,
        orderIndex: last?.orderIndex ? last.orderIndex + 1 : 1,
        isApprovedByTeacher: dto.isApprovedByTeacher ?? false,
      },
    })

    return this.toDto(created)
  }

  async update(
    pageId: number,
    activityId: number,
    dto: UpdateActivityDto,
    user: User,
  ): Promise<ActivityDto> {
    await this.getPageForWrite(pageId, user)

    const existing = await this.dbService.activity.findUnique({
      where: { id: activityId },
    })
    if (!existing || existing.pageId !== pageId) {
      throw new NotFoundException('Actividad no encontrada')
    }

    const updated = await this.dbService.activity.update({
      where: { id: activityId },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.question !== undefined && { question: dto.question }),
        ...(dto.options !== undefined && {
          options: dto.options === null ? Prisma.JsonNull : dto.options,
        }),
        ...(dto.correctAnswer !== undefined && {
          correctAnswer: dto.correctAnswer,
        }),
        ...(dto.explanation !== undefined && { explanation: dto.explanation }),
        ...(dto.difficulty !== undefined && { difficulty: dto.difficulty }),
        ...(dto.isApprovedByTeacher !== undefined && {
          isApprovedByTeacher: dto.isApprovedByTeacher,
        }),
        ...(dto.usedAsExample !== undefined && {
          usedAsExample: dto.usedAsExample,
        }),
      },
    })

    return this.toDto(updated)
  }

  async delete(pageId: number, activityId: number, user: User): Promise<void> {
    await this.getPageForWrite(pageId, user)

    const existing = await this.dbService.activity.findUnique({
      where: { id: activityId },
    })
    if (!existing || existing.pageId !== pageId) {
      throw new NotFoundException('Actividad no encontrada')
    }

    await this.dbService.activity.delete({ where: { id: activityId } })
  }

  // async generate(
  //   pageId: number,
  //   dto: GenerateActivityDto,
  //   user: User,
  // ): Promise<GeneratedActivityDto> {
  //   const page = await this.getPageForRead(pageId, user)

  //   const blocks = await this.dbService.block.findMany({
  //     where: {
  //       pageId,
  //     },
  //     orderBy: { id: 'asc' },
  //   })

  //   const lessonContext = this.buildLessonContext(blocks)

  //   const language = page.module.aiConfiguration?.language ?? 'es'
  //   const difficulty = dto.difficulty ?? 2

  //   const prompt = generateActivityPrompt({
  //     type: dto.type,
  //     language,
  //     difficulty,
  //     lessonTitle: page.title,
  //     lessonContext,
  //     instructions: dto.instructions,
  //   })

  //   const ai =
  //     await this.openAiService.getResponse<GeneratedActivityDto>(prompt)

  //   return ai.content
  // }

  async createAttempt(
    activityId: number,
    dto: CreateActivityAttemptDto,
    user: User,
  ): Promise<ActivityAttemptDto> {
    const activity = await this.dbService.activity.findUnique({
      where: { id: activityId },
      include: {
        page: { include: { module: { include: { enrollments: true } } } },
      },
    })

    if (!activity) {
      throw new NotFoundException('Actividad no encontrada')
    }

    // student access check
    await this.getPageForRead(activity.pageId, user)

    const lastAttempt = await this.dbService.activityAttempt.findFirst({
      where: { activityId, userId: user.id },
      orderBy: { attemptNumber: 'desc' },
    })

    const attemptNumber = (lastAttempt?.attemptNumber ?? 0) + 1

    const isCorrect = this.evaluateAttempt(activity, dto.studentAnswer)

    const created = await this.dbService.activityAttempt.create({
      data: {
        activityId,
        userId: user.id,
        studentAnswer: dto.studentAnswer,
        isCorrect,
        attemptNumber,
      },
    })

    return {
      id: created.id,
      activityId: created.activityId,
      userId: created.userId,
      studentAnswer:
        typeof created.studentAnswer === 'string'
          ? JSON.parse(created.studentAnswer)
          : (created.studentAnswer as any),
      isCorrect: created.isCorrect,
      attemptNumber: created.attemptNumber,
      createdAt: created.createdAt,
    }
  }

  private evaluateAttempt(
    activity: Activity,
    studentAnswer: Record<string, any>,
  ): boolean {
    const type = activity.type as unknown as ActivityType
    const correct =
      typeof activity.correctAnswer === 'string'
        ? JSON.parse(activity.correctAnswer)
        : (activity.correctAnswer as any)

    try {
      switch (type) {
        case 'MULTIPLE_CHOICE':
          return (
            String((studentAnswer as any).optionId) === String(correct.optionId)
          )
        case 'TRUE_FALSE':
          return (
            Boolean((studentAnswer as any).value) === Boolean(correct.value)
          )
        case 'FILL_BLANK': {
          const sRaw = (studentAnswer as any).answers
          const s = Array.isArray(sRaw)
            ? sRaw
            : (studentAnswer as any).answer !== undefined
              ? [(studentAnswer as any).answer]
              : []

          const cRaw = correct.answers
          const c = Array.isArray(cRaw)
            ? cRaw
            : correct.answer !== undefined
              ? [correct.answer]
              : []
          if (s.length !== c.length) return false
          return s.every(
            (ans: any, i: number) =>
              String(ans).trim().toLocaleLowerCase() ===
              String(c[i]).trim().toLocaleLowerCase(),
          )
        }
        case 'MATCH': {
          const sPairsRaw = (studentAnswer as any).pairs
          const sPairs = Array.isArray(sPairsRaw) ? sPairsRaw : []
          const cPairsRaw = correct.pairs
          const cPairs = Array.isArray(cPairsRaw) ? cPairsRaw : []
          if (sPairs.length !== cPairs.length) return false
          const norm = (pairs: any[]) =>
            pairs
              .map((p) => ({
                left: String(p.left ?? '').trim(),
                right: String(p.right ?? '').trim(),
              }))
              .sort((a, b) => a.left.localeCompare(b.left))
          return JSON.stringify(norm(sPairs)) === JSON.stringify(norm(cPairs))
        }
        default:
          return false
      }
    } catch {
      return false
    }
  }

  private buildLessonContext(blocks: any[]): string {
    const mapped = blocks.map((b) => BlocksMapper.mapToDto(b))
    const parts: string[] = []

    for (const block of mapped) {
      if (block.type === BlockType.TEXT) {
        const markdown = String((block.content as any).markdown || '')
        if (markdown.trim()) parts.push(markdown.trim())
      } else if (block.type === BlockType.CODE) {
        const lang = String((block.content as any).language ?? '')
        const code = String((block.content as any).code ?? '')
        const codeTrim = String(code).trim()
        if (codeTrim) parts.push(`Código (${lang || 'code'}):\n${codeTrim}`)
      }
    }

    return parts.join('\n\n---\n\n')
  }
}
