import { CoreModule } from './core/core.module'
import { LearningObjectsModule } from './features/learning-objects/learning-objects.module'
import { Module } from '@nestjs/common'
import { EmbeddingsWorker } from './features/learning-objects/main/workers/embeddings.worker'
import { TeacherFeedbackModule } from './features/teacher-feedback/teacher-feedback.module'
import { TeacherFeedbackWorker } from './features/teacher-feedback/workers/teacher-feedback.worker'
import { VideosModule } from './features/videos/videos.module'
import { VideoProcessingWorker } from './features/videos/workers/video-processing.worker'

@Module({
  imports: [
    CoreModule,
    LearningObjectsModule,
    TeacherFeedbackModule,
    VideosModule,
  ],
  providers: [EmbeddingsWorker, TeacherFeedbackWorker, VideoProcessingWorker],
})
export class WorkerModule {}
