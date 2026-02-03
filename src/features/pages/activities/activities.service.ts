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
import { ActivityType, BlockType } from 'src/core/database/generated/enums'
import { BlocksMapper } from '../blocks/mappers/blocks.mapper'
import { CreateActivityDto } from './dtos/req/create-activity.dto'
import { UpdateActivityDto } from './dtos/req/update-activity.dto'
import { CreateActivityAttemptDto } from './dtos/req/create-activity-attempt.dto'
import { ActivityDto } from './dtos/res/activity.dto'
import { ActivityAttemptDto } from './dtos/res/activity-attempt.dto'
import { PagesHelperService } from '../main/pages-helper.service'
import { ActivitiesMapper } from './mappers/activities.mapper'
import {
  ActivityAttemptAnswer,
  FillBlankAttempt,
  MatchAttempt,
  MultipleChoiceAttempt,
  TrueFalseAttempt,
} from './interfaces/activity-attempt.interface'
import {
  AiGeneratedActivity,
  AiGeneratedFillBlankActivity,
  AiGeneratedMatchActivity,
  AiGeneratedMultipleChoiceActivity,
  AiGeneratedTrueFalseActivity,
} from '../content-generation/interfaces/ai-generated-activity.interface'

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly dbService: DBService,
    private readonly openAiService: OpenaiService,
    private readonly pagesHelperService: PagesHelperService,
  ) {}

  async list(pageId: number, user: User): Promise<ActivityDto[]> {
    await this.pagesHelperService.getPageForRead(pageId, user)
    const activities = await this.dbService.activity.findMany({
      where: { pageId },
      orderBy: { orderIndex: 'asc' },
    })
    return activities.map((a) => ActivitiesMapper.mapToDto(a))
  }

  async create(
    pageId: number,
    dto: CreateActivityDto,
    user: User,
  ): Promise<ActivityDto> {
    await this.pagesHelperService.getPageForWrite(pageId, user)

    const last = await this.dbService.activity.findFirst({
      where: { pageId },
      orderBy: { orderIndex: 'desc' },
    })

    const created = await this.dbService.activity.create({
      data: {
        pageId,
        type: dto.type,
        question: dto.question,
        options: JSON.stringify(dto.options),
        explanation: dto.explanation ?? null,
        difficulty: dto.difficulty ?? 1,
        orderIndex: last?.orderIndex ? last.orderIndex + 1 : 1,
        isApprovedByTeacher: dto.isApprovedByTeacher ?? false,
      },
    })

    return ActivitiesMapper.mapToDto(created)
  }

  async update(
    pageId: number,
    activityId: number,
    dto: UpdateActivityDto,
    user: User,
  ): Promise<ActivityDto> {
    await this.pagesHelperService.getPageForWrite(pageId, user)

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

    return ActivitiesMapper.mapToDto(updated)
  }

  async delete(pageId: number, activityId: number, user: User): Promise<void> {
    await this.pagesHelperService.getPageForWrite(pageId, user)

    const existing = await this.dbService.activity.findUnique({
      where: { id: activityId },
    })
    if (!existing || existing.pageId !== pageId) {
      throw new NotFoundException('Actividad no encontrada')
    }

    await this.dbService.activity.delete({ where: { id: activityId } })
  }

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
    await this.pagesHelperService.getPageForRead(activity.pageId, user)

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
        studentAnswer: JSON.stringify(dto.studentAnswer),
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
    studentAnswer: ActivityAttemptAnswer,
  ): boolean {
    const type = activity.type
    const options = JSON.parse(
      activity.options as string,
    ) as AiGeneratedActivity

    try {
      switch (type) {
        case ActivityType.MULTIPLE_CHOICE:
          return (
            (studentAnswer as MultipleChoiceAttempt).selectedOption ===
            (options as AiGeneratedMultipleChoiceActivity).correctAnswer
          )
        case ActivityType.TRUE_FALSE:
          return (
            Boolean((studentAnswer as TrueFalseAttempt).answer) ===
            Boolean((options as AiGeneratedTrueFalseActivity).correctAnswer)
          )
        case ActivityType.FILL_BLANK: {
          const answer = (studentAnswer as FillBlankAttempt).answer

          const correctAnswers = (options as AiGeneratedFillBlankActivity)
            .acceptableAnswers
          return correctAnswers.some(
            (correctAnswer) =>
              String(answer).trim().toLocaleLowerCase() ===
              String(correctAnswer).trim().toLocaleLowerCase(),
          )
        }
        case ActivityType.MATCH: {
          const sPairsRaw = (studentAnswer as MatchAttempt).matches
          const sPairs = Array.isArray(sPairsRaw) ? sPairsRaw : []
          const cPairsRaw = (options as AiGeneratedMatchActivity).pairs
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
}
