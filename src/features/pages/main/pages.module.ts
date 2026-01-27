import { Module } from '@nestjs/common'
import { PagesController } from './pages.controller'
import { PagesService } from './pages.service'
import { ContentGenerationController } from '../content-generation/content-generation.controller'
import { ContentGenerationService } from '../content-generation/content-generation.service'
import { AIModule } from 'src/providers/ai/ai.module'
import { BullModule } from '@nestjs/bullmq'
import { QUEUE_NAMES } from 'src/shared/constants/queues'

@Module({
  imports: [
    AIModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.CONCEPTS.NAME,
    }),
  ],
  controllers: [PagesController, ContentGenerationController],
  providers: [PagesService, ContentGenerationService],
  exports: [PagesService, ContentGenerationService],
})
export class PagesModule { }
