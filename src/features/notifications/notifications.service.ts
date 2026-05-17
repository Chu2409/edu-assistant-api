import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { NotificationType } from 'src/core/database/generated/client'
import { NotificationDto } from './dtos/res/notification.dto'
import { PaginatedNotificationsDto } from './dtos/res/paginated-notifications.dto'
import { BaseParamsReqDto } from 'src/shared/dtos/req/base-params.dto'

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)

  constructor(private readonly dbService: DBService) {}

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
    } catch (error: unknown) {
      this.logger.error(
        `Error al crear notificación: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  /**
   * Create notifications for multiple users at once
   */
  async createBulkNotifications(data: {
    userIds: number[]
    type: NotificationType
    title: string
    message: string
    relatedEntityId?: number
    relatedEntityType?: string
  }): Promise<void> {
    if (data.userIds.length === 0) {
      return
    }

    try {
      await this.dbService.notification.createMany({
        data: data.userIds.map((userId) => ({
          userId,
          type: data.type,
          title: data.title,
          message: data.message,
          relatedEntityId: data.relatedEntityId,
          relatedEntityType: data.relatedEntityType,
        })),
      })
    } catch (error: unknown) {
      this.logger.error(
        `Error al crear notificaciones bulk: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }
}
