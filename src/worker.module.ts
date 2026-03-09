import { CoreModule } from './core/core.module'
import { PagesModule } from './features/pages/main/pages.module'
import { Module } from '@nestjs/common'
import { EmbeddingsWorker } from './features/pages/content-generation/workers/embeddinggs.worker'

@Module({
  imports: [CoreModule, PagesModule],
  providers: [EmbeddingsWorker],
})
export class WorkerModule {}
