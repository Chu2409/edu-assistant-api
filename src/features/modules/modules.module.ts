import { Module, OnModuleInit, Logger } from '@nestjs/common'
import { BullModule, InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { EmailModule } from 'src/providers/email/email.module'
import { QUEUE_NAMES } from 'src/shared/constants/queues'
import { ModulesController } from './main/modules.controller'
import { ModulesService } from './main/modules.service'
import { EnrollmentsController } from './enrollments/enrollments.controller'
import { EnrollmentsService } from './enrollments/enrollments.service'

@Module({
  imports: [
    EmailModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.ENROLLMENTS.NAME,
    }),
  ],
  controllers: [ModulesController, EnrollmentsController],
  providers: [ModulesService, EnrollmentsService],
  exports: [EnrollmentsService],
})
export class ModulesModule implements OnModuleInit {
  private readonly logger = new Logger(ModulesModule.name)

  constructor(
    @InjectQueue(QUEUE_NAMES.ENROLLMENTS.NAME)
    private readonly enrollmentsQueue: Queue,
  ) {}

  async onModuleInit() {
    await this.enrollmentsQueue.upsertJobScheduler(
      'daily-enrollment-summary-scheduler',
      { pattern: '50 23 * * *' },
      {
        name: QUEUE_NAMES.ENROLLMENTS.JOBS.DAILY_SUMMARY,
      },
    )

    this.logger.log(
      'Resumen diario de inscripciones programado para las 11:50 PM',
    )
  }
}
