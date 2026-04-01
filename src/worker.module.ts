import { CoreModule } from './core/core.module'
import { PagesModule } from './features/learning-objects/pages.module'
import { Module } from '@nestjs/common'
import { EmbeddingsWorker } from './features/learning-objects/main/workers/embeddings.worker'

@Module({
  imports: [CoreModule, PagesModule],
  providers: [EmbeddingsWorker],
})
export class WorkerModule {}
