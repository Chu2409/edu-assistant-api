import { Module, OnModuleInit, Logger } from '@nestjs/common'
import { BullModule, InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { AIModule } from 'src/providers/ai/ai.module'
import { EmailModule } from 'src/providers/email/email.module'
import { QUEUE_NAMES } from 'src/shared/constants/queues'
import { TeacherFeedbackController } from './teacher-feedback.controller'
import { TeacherFeedbackService } from './teacher-feedback.service'
import { FeedbackDataCollectorService } from './services/feedback-data-collector.service'

@Module({
  imports: [
    AIModule,
    EmailModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.TEACHER_FEEDBACK.NAME,
    }),
  ],
  controllers: [TeacherFeedbackController],
  providers: [TeacherFeedbackService, FeedbackDataCollectorService],
  exports: [TeacherFeedbackService],
})
export class TeacherFeedbackModule implements OnModuleInit {
  private readonly logger = new Logger(TeacherFeedbackModule.name)

  constructor(
    @InjectQueue(QUEUE_NAMES.TEACHER_FEEDBACK.NAME)
    private readonly feedbackQueue: Queue,
  ) {}

  async onModuleInit() {
    await this.feedbackQueue.upsertJobScheduler(
      'teacher-feedback-scheduler',
      { pattern: '0 9 * * 6' },
      {
        name: QUEUE_NAMES.TEACHER_FEEDBACK.JOBS.GENERATE_ALL,
      },
    )

    this.logger.log(
      'Job de feedback pedagógico programado para los sábados a las 9 AM',
    )
  }
}
