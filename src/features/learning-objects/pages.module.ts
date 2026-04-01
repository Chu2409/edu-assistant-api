import { Module } from '@nestjs/common'
import { PagesController } from './main/pages.controller'
import { PagesService } from './main/pages.service'
import { AIModule } from 'src/providers/ai/ai.module'
import { PagesHelperService } from './main/pages-helper.service'
import { PageConceptsController } from './lo-concepts/page-concepts.controller'
import { PageConceptsService } from './lo-concepts/page-concepts.service'
import { PageRelationsController } from './lo-relations/page-relations.controller'
import { PageRelationsService } from './lo-relations/page-relations.service'
import { BullModule } from '@nestjs/bullmq'
import { QUEUE_NAMES } from 'src/shared/constants/queues'

@Module({
  imports: [
    AIModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.EMBEDDINGS.NAME,
    }),
  ],
  controllers: [
    PagesController,
    PageConceptsController,
    PageRelationsController,
  ],
  providers: [
    PagesService,
    PagesHelperService,
    PageConceptsService,
    PageRelationsService,
  ],
  exports: [PagesService, PageRelationsService, PagesHelperService],
})
export class PagesModule {}
