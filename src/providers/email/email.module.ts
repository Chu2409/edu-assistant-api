import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { EmailService } from './email.service'
import { EmailDailyLimitService } from './services/email-daily-limit.service'

@Module({
  imports: [HttpModule],
  providers: [EmailService, EmailDailyLimitService],
  exports: [EmailService, EmailDailyLimitService],
})
export class EmailModule {}
