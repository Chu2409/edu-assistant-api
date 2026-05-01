import { Module, OnModuleInit, Logger } from '@nestjs/common'
import { BullModule, InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { EmailModule } from 'src/providers/email/email.module'
import { AIModule } from 'src/providers/ai/ai.module'
import { QUEUE_NAMES } from 'src/shared/constants/queues'
import { StudentAIFeedbackService } from './student-ai-feedback.service'
import { StudentAIFeedbackController } from './student-ai-feedback.controller'
import { StudentFeedbackDataCollectorService } from './services/student-feedback-data-collector.service'
import { StudentAIFeedbackWorker } from './workers/student-ai-feedback.worker'

@Module({
  imports: [
    EmailModule,
    AIModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.STUDENT_AI_FEEDBACK.NAME,
    }),
  ],
  controllers: [StudentAIFeedbackController],
  providers: [
    StudentAIFeedbackService,
    StudentFeedbackDataCollectorService,
    StudentAIFeedbackWorker,
  ],
  exports: [StudentAIFeedbackService],
})
export class StudentAIFeedbackModule implements OnModuleInit {
  private readonly logger = new Logger(StudentAIFeedbackModule.name)

  constructor(
    @InjectQueue(QUEUE_NAMES.STUDENT_AI_FEEDBACK.NAME)
    private readonly studentAIFeedbackQueue: Queue,
  ) {}

  async onModuleInit() {
    // Schedule for Sundays at 9 AM
    await this.studentAIFeedbackQueue.upsertJobScheduler(
      'weekly-student-ai-feedback-scheduler',
      { pattern: '0 9 * * 0' },
      {
        name: QUEUE_NAMES.STUDENT_AI_FEEDBACK.JOBS.GENERATE_ALL,
      },
    )

    this.logger.log(
      'Job de feedback IA de estudiantes programado para los domingos a las 9 AM',
    )
  }
}
