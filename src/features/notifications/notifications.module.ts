import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { NotificationsService } from './notifications.service'
import { NotificationsController } from './notifications.controller'
import { NotificationsWorker } from './workers/notifications.worker'
import { QUEUE_NAMES } from 'src/shared/constants/queues'

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUE_NAMES.NOTIFICATIONS.NAME,
    }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsWorker],
  exports: [NotificationsService],
})
export class NotificationsModule {}
