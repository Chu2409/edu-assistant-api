import { CoreModule } from './core/core.module'
import { LearningObjectsModule } from './features/learning-objects/learning-objects.module'
import { Module } from '@nestjs/common'
import { EmbeddingsWorker } from './features/learning-objects/main/workers/embeddings.worker'
import { TeacherFeedbackModule } from './features/teacher-feedback/teacher-feedback.module'
import { TeacherFeedbackWorker } from './features/teacher-feedback/workers/teacher-feedback.worker'
import { EnrollmentsWorker } from './features/modules/enrollments/workers/enrollments.worker'
import { ModulesModule } from './features/modules/modules.module'
import { VideosModule } from './features/videos/videos.module'
import { VideoProcessingWorker } from './features/videos/workers/video-processing.worker'
import { StudentAIFeedbackModule } from './features/student-ai-feedback/student-ai-feedback.module'
import { StudentAIFeedbackWorker } from './features/student-ai-feedback/workers/student-ai-feedback.worker'
import { EmailModule } from './providers/email/email.module'
import { NotificationsModule } from './features/notifications/notifications.module'
import { NotificationsWorker } from './features/notifications/workers/notifications.worker'

@Module({
  imports: [
    CoreModule,
    LearningObjectsModule,
    TeacherFeedbackModule,
    VideosModule,
    ModulesModule,
    StudentAIFeedbackModule,
    EmailModule,
    NotificationsModule,
  ],
  providers: [
    EmbeddingsWorker,
    TeacherFeedbackWorker,
    VideoProcessingWorker,
    EnrollmentsWorker,
    StudentAIFeedbackWorker,
    NotificationsWorker,
  ],
})
export class WorkerModule {}
