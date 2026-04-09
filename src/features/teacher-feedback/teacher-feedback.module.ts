import { Module, OnModuleInit, Logger } from '@nestjs/common'
import { BullModule, InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { AIModule } from 'src/providers/ai/ai.module'
import { QUEUE_NAMES } from 'src/shared/constants/queues'
import { TeacherFeedbackController } from './teacher-feedback.controller'
import { TeacherFeedbackService } from './teacher-feedback.service'
import { FeedbackDataCollectorService } from './services/feedback-data-collector.service'
import { TeacherFeedbackWorker } from './workers/teacher-feedback.worker'
import { FEEDBACK_CRON_INTERVAL_MS } from './constants/thresholds'

@Module({
  imports: [
    AIModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.TEACHER_FEEDBACK.NAME,
    }),
  ],
  controllers: [TeacherFeedbackController],
  providers: [
    TeacherFeedbackService,
    FeedbackDataCollectorService,
    TeacherFeedbackWorker,
  ],
  exports: [TeacherFeedbackService],
})
export class TeacherFeedbackModule implements OnModuleInit {
  private readonly logger = new Logger(TeacherFeedbackModule.name)

  constructor(
    @InjectQueue(QUEUE_NAMES.TEACHER_FEEDBACK.NAME)
    private readonly feedbackQueue: Queue,
  ) {}

  async onModuleInit() {
    // Registrar el job repeatable (cron cada 24 horas)
    await this.feedbackQueue.upsertJobScheduler(
      'teacher-feedback-scheduler',
      { every: FEEDBACK_CRON_INTERVAL_MS },
      {
        name: QUEUE_NAMES.TEACHER_FEEDBACK.JOBS.GENERATE_ALL,
      },
    )

    this.logger.log(
      `Job de feedback pedagógico programado cada ${FEEDBACK_CRON_INTERVAL_MS / 3600000}h`,
    )
  }
}
