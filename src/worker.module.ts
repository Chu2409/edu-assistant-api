import { CoreModule } from './core/core.module'
import { LearningObjectsModule } from './features/learning-objects/learning-objects.module'
import { Module } from '@nestjs/common'
import { EmbeddingsWorker } from './features/learning-objects/main/workers/embeddings.worker'

@Module({
  imports: [CoreModule, LearningObjectsModule],
  providers: [EmbeddingsWorker],
})
export class WorkerModule {}
