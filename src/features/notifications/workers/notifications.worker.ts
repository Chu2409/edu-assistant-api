import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { QUEUE_NAMES } from 'src/shared/constants/queues'
import { DBService } from 'src/core/database/database.service'
import { NotificationsService } from '../notifications.service'
import { NotificationType } from 'src/core/database/generated/client'

export interface LoPublishedJobData {
  loId: number
  title: string
  moduleId: number
}

@Processor(QUEUE_NAMES.NOTIFICATIONS.NAME)
export class NotificationsWorker extends WorkerHost {
  private readonly logger = new Logger(NotificationsWorker.name)

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly dbService: DBService,
  ) {
    super()
  }

  async process(job: Job): Promise<unknown> {
    switch (job.name) {
      case QUEUE_NAMES.NOTIFICATIONS.JOBS.CREATE:
        return this.handleCreateNotification(job.data)
      default:
        this.logger.warn(`Unknown job name: ${job.name}`)
    }
  }

  private async handleCreateNotification(data: {
    type: string
    userId?: number
    userIds?: number[]
    title: string
    message: string
    relatedEntityId?: number
    relatedEntityType?: string
  }) {
    this.logger.log(`Creating notification: ${data.type} for user(s)`)

    try {
      if (data.userIds && data.userIds.length > 0) {
        await this.notificationsService.createBulkNotifications({
          userIds: data.userIds,
          type: data.type as NotificationType,
          title: data.title,
          message: data.message,
          relatedEntityId: data.relatedEntityId,
          relatedEntityType: data.relatedEntityType,
        })
        return { success: true, count: data.userIds.length }
      }

      if (data.userId) {
        await this.notificationsService.createNotification({
          userId: data.userId,
          type: data.type as NotificationType,
          title: data.title,
          message: data.message,
          relatedEntityId: data.relatedEntityId,
          relatedEntityType: data.relatedEntityType,
        })
        return { success: true, userId: data.userId }
      }

      this.logger.warn('No userId or userIds provided for notification')
      return { success: false, reason: 'no_users' }
    } catch (error: unknown) {
      this.logger.error(
        `Error creating notification: ${error instanceof Error ? error.message : String(error)}`,
      )
      throw error
    }
  }
}
