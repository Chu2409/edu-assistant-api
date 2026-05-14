import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { NotificationType } from 'src/core/database/generated/client'
import { NotificationDto } from './dtos/res/notification.dto'
import { PaginatedNotificationsDto } from './dtos/res/paginated-notifications.dto'
import { BaseParamsReqDto } from 'src/shared/dtos/req/base-params.dto'
import { OnEvent } from '@nestjs/event-emitter'

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)

  constructor(private readonly dbService: DBService) {}

  @OnEvent('lo.published')
  async handleLoPublished(payload: {
    loId: number
    title: string
    moduleId: number
  }) {
    const enrollments = await this.dbService.enrollment.findMany({
      where: { moduleId: payload.moduleId, isActive: true },
      select: { userId: true },
    })

    const notifications = enrollments.map((e) => ({
      userId: e.userId,
      type: NotificationType.NEW_PAGE,
      title: 'Nueva página añadida',
      message: `Se ha publicado una nueva lección: "${payload.title}"`,
      relatedEntityId: payload.loId,
      relatedEntityType: 'LearningObject',
    }))

    if (notifications.length > 0) {
      await this.dbService.notification.createMany({
        data: notifications,
      })
    }
  }

  @OnEvent('digest.generated')
  async handleDigestGenerated(payload: {
    studentId: number
    moduleId: number
    feedbackId: number
    moduleTitle: string
  }) {
    await this.createNotification({
      userId: payload.studentId,
      type: NotificationType.WEEKLY_DIGEST,
      title: 'Resumen semanal disponible',
      message: `Tu resumen semanal del módulo "${payload.moduleTitle}" ya está listo.`,
      relatedEntityId: payload.feedbackId,
      relatedEntityType: 'StudentAiFeedback',
    })
  }

  @OnEvent('student.enrolled')
  async handleStudentEnrolled(payload: {
    studentId: number
    moduleId: number
    moduleTitle: string
  }) {
    await this.createNotification({
      userId: payload.studentId,
      type: NotificationType.NEW_ENROLLMENT,
      title: 'Inscripción confirmada',
      message: `Te has inscrito exitosamente en el módulo: "${payload.moduleTitle}"`,
      relatedEntityId: payload.moduleId,
      relatedEntityType: 'Module',
    })
  }

  @OnEvent('student.enrolled.bulk')
  async handleBulkEnrollment(payload: {
    studentIds: number[]
    moduleId: number
    moduleTitle: string
  }) {
    const notifications = payload.studentIds.map((userId) => ({
      userId,
      type: NotificationType.NEW_ENROLLMENT,
      title: 'Inscripción confirmada',
      message: `Has sido inscrito en el módulo: "${payload.moduleTitle}"`,
      relatedEntityId: payload.moduleId,
      relatedEntityType: 'Module',
    }))

    if (notifications.length > 0) {
      await this.dbService.notification.createMany({
        data: notifications,
      })
    }
  }

  @OnEvent('teacher.feedback.generated')
  async handleTeacherFeedbackGenerated(payload: {
    teacherId: number
    moduleId: number
    moduleTitle: string
  }) {
    await this.createNotification({
      userId: payload.teacherId,
      type: NotificationType.TEACHER_AI_FEEDBACK,
      title: 'Nuevo reporte de feedback IA',
      message: `Se ha generado un nuevo reporte pedagógico para tu módulo: "${payload.moduleTitle}"`,
      relatedEntityId: payload.moduleId,
      relatedEntityType: 'Module',
    })
  }

  async listByUser(
    userId: number,
    params: BaseParamsReqDto,
  ): Promise<PaginatedNotificationsDto> {
    const { page, limit } = params
    const skip = (page - 1) * limit

    const [total, records] = await Promise.all([
      this.dbService.notification.count({ where: { userId } }),
      this.dbService.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ])

    return {
      records: records as NotificationDto[],
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    }
  }

  async markAsRead(userId: number, notificationId: number): Promise<void> {
    const notification = await this.dbService.notification.findFirst({
      where: { id: notificationId, userId },
    })

    if (!notification) {
      throw new NotFoundException(
        `Notificación con ID ${notificationId} no encontrada`,
      )
    }

    await this.dbService.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    })
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.dbService.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })
  }

  async createNotification(data: {
    userId: number
    type: NotificationType
    title: string
    message: string
    relatedEntityId?: number
    relatedEntityType?: string
  }): Promise<void> {
    try {
      await this.dbService.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          relatedEntityId: data.relatedEntityId,
          relatedEntityType: data.relatedEntityType,
        },
      })
    } catch (error) {
      this.logger.error(`Error al crear notificación: ${error.message}`)
    }
  }
}
