import { CoreModule } from './core/core.module'
import { PagesModule } from './features/pages/pages.module'
import { Module } from '@nestjs/common'
import { EmbeddingsWorker } from './features/pages/main/workers/embeddinggs.worker'

@Module({
  imports: [CoreModule, PagesModule],
  providers: [EmbeddingsWorker],
})
export class WorkerModule {}
