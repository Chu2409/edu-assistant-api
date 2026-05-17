import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { BullModule } from '@nestjs/bullmq'
import { EmailService } from './email.service'
import { EmailDailyLimitService } from './services/email-daily-limit.service'
import { QUEUE_NAMES } from 'src/shared/constants/queues'

@Module({
  imports: [
    HttpModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.EMAIL_QUEUE.NAME,
    }),
  ],
  providers: [EmailService, EmailDailyLimitService],
  exports: [EmailService],
})
export class EmailModule {}
