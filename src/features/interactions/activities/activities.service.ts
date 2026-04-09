/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { Injectable, NotFoundException } from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { Activity, Prisma, type User } from 'src/core/database/generated/client'
import { ActivityType } from 'src/core/database/generated/enums'
import { CreateActivityDto } from './dtos/req/create-activity.dto'
import { UpdateActivityDto } from './dtos/req/update-activity.dto'
import { CreateActivityAttemptDto } from './dtos/req/create-activity-attempt.dto'
import { ActivityDto } from './dtos/res/activity.dto'
import { ActivityAttemptDto } from './dtos/res/activity-attempt.dto'
import { ActivitiesMapper } from './mappers/activities.mapper'
import {
  ActivityAttemptAnswer,
  FillBlankAttempt,
  MatchAttempt,
  MultipleChoiceAttempt,
  TrueFalseAttempt,
} from './interfaces/activity-attempt.interface'

import { parseJsonField } from 'src/providers/ai/helpers/utils'
import {
  AiGeneratedActivity,
  AiFillBlankActivity,
  AiGeneratedMatchActivity,
  AiMultipleChoiceActivity,
  AiTrueFalseActivity,
} from 'src/features/content-generation/activities/interfaces/ai-generated-activity.interface'
import { LoHelperService } from 'src/features/learning-objects/main/lo-helper.service'

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly dbService: DBService,
    private readonly loHelperService: LoHelperService,
  ) {}

  async list(learningObjectId: number, user: User): Promise<ActivityDto[]> {
    await this.loHelperService.getLoForRead(learningObjectId, user)
    const activities = await this.dbService.activity.findMany({
      where: { learningObjectId },
      orderBy: { orderIndex: 'asc' },
    })
    return activities.map((a) => ActivitiesMapper.mapToDto(a))
  }

  async create(
    learningObjectId: number,
    dto: CreateActivityDto,
    user: User,
  ): Promise<ActivityDto> {
    await this.loHelperService.getLoForWrite(learningObjectId, user)

    const last = await this.dbService.activity.findFirst({
      where: { learningObjectId },
      orderBy: { orderIndex: 'desc' },
    })

    const content = this.extractActivityContent(dto.type, dto.options)

    const created = await this.dbService.activity.create({
      data: {
        learningObjectId,
        type: dto.type,
        question: content.question ?? '',
        options: JSON.stringify(dto.options),
        explanation: content.explanation,
        difficulty: dto.difficulty ?? 1,
        orderIndex: last?.orderIndex ? last.orderIndex + 1 : 1,
        isApprovedByTeacher: dto.isApprovedByTeacher ?? false,
      },
    })

    return ActivitiesMapper.mapToDto(created)
  }

  async update(
    learningObjectId: number,
    activityId: number,
    dto: UpdateActivityDto,
    user: User,
  ): Promise<ActivityDto> {
    await this.loHelperService.getLoForWrite(learningObjectId, user)

    const existing = await this.dbService.activity.findUnique({
      where: { id: activityId },
    })
    if (!existing || existing.learningObjectId !== learningObjectId) {
      throw new NotFoundException('Actividad no encontrada')
    }

    const updatedType = dto.type ?? existing.type
    let updatedQuestion: string | undefined
    let updatedExplanation: string | null | undefined

    if (dto.options !== undefined && dto.options !== null) {
      const content = this.extractActivityContent(updatedType, dto.options)
      if (content.question !== null) updatedQuestion = content.question
      updatedExplanation = content.explanation
    }

    const updated = await this.dbService.activity.update({
      where: { id: activityId },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(updatedQuestion !== undefined && { question: updatedQuestion }),
        ...(dto.options !== undefined && {
          options:
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            dto.options === null ? Prisma.JsonNull : (dto.options as any),
        }),
        ...(updatedExplanation !== undefined && {
          explanation: updatedExplanation,
        }),
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

  async delete(
    learningObjectId: number,
    activityId: number,
    user: User,
  ): Promise<void> {
    await this.loHelperService.getLoForWrite(learningObjectId, user)

    const existing = await this.dbService.activity.findUnique({
      where: { id: activityId },
    })
    if (!existing || existing.learningObjectId !== learningObjectId) {
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
        learningObject: {
          include: { module: { include: { enrollments: true } } },
        },
      },
    })

    if (!activity) {
      throw new NotFoundException('Actividad no encontrada')
    }

    // student access check
    await this.loHelperService.getLoForRead(activity.learningObjectId, user)

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
      isCorrect: created.isCorrect,
      attemptNumber: created.attemptNumber,
      createdAt: created.createdAt,
    }
  }

  private extractActivityContent(
    type: ActivityType,
    options: AiGeneratedActivity,
  ): { question: string | null; explanation: string | null } {
    if (!options) return { question: null, explanation: null }

    switch (type) {
      case ActivityType.MULTIPLE_CHOICE:
        return {
          question: (options as AiMultipleChoiceActivity).question ?? null,
          explanation:
            (options as AiMultipleChoiceActivity).explanation ?? null,
        }
      case ActivityType.TRUE_FALSE:
        return {
          question: (options as AiTrueFalseActivity).statement ?? null,
          explanation: (options as AiTrueFalseActivity).explanation ?? null,
        }
      case ActivityType.FILL_BLANK:
        return {
          question: (options as AiFillBlankActivity).sentence ?? null,
          explanation: (options as AiFillBlankActivity).explanation ?? null,
        }
      case ActivityType.MATCH:
        return {
          question: (options as AiGeneratedMatchActivity).instructions ?? null,
          explanation: null,
        }
      default:
        return { question: null, explanation: null }
    }
  }

  private evaluateAttempt(
    activity: Activity,
    studentAnswer: ActivityAttemptAnswer,
  ): boolean {
    const type = activity.type
    const options = parseJsonField<AiGeneratedActivity>(activity.options)

    try {
      switch (type) {
        case ActivityType.MULTIPLE_CHOICE:
          return (
            (studentAnswer as MultipleChoiceAttempt).selectedOption ===
            (options as AiMultipleChoiceActivity).correctAnswer
          )
        case ActivityType.TRUE_FALSE:
          return (
            Boolean((studentAnswer as TrueFalseAttempt).answer) ===
            Boolean((options as AiTrueFalseActivity).correctAnswer)
          )
        case ActivityType.FILL_BLANK: {
          const answer = (studentAnswer as FillBlankAttempt).answer

          const correctAnswers = (options as AiFillBlankActivity)
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
