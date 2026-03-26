import { Module } from '@nestjs/common'
import { PagesController } from './pages.controller'
import { PagesService } from './pages.service'
import { ContentGenerationController } from '../content-generation/content-generation.controller'
import { ContentGenerationService } from '../content-generation/content-generation.service'
import { AIModule } from 'src/providers/ai/ai.module'
import { BullModule } from '@nestjs/bullmq'
import { QUEUE_NAMES } from 'src/shared/constants/queues'
import { PagesHelperService } from './pages-helper.service'
import { PageConceptsController } from '../page-concepts/page-concepts.controller'
import { PageConceptsService } from '../page-concepts/page-concepts.service'
import { ChatService } from '../chat/chat.service'
import { PageRelationsController } from '../page-relations/page-relations.controller'
import { PageRelationsService } from '../page-relations/page-relations.service'
import { PageSessionsController } from '../chat/pages-sessions.controller'
import { SessionMessagesController } from '../chat/sessions-messages.controller'

@Module({
  imports: [
    AIModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.EMBEDDINGS.NAME,
    }),
  ],
  controllers: [
    PagesController,
    ContentGenerationController,
    PageConceptsController,
    PageSessionsController,
    SessionMessagesController,
    PageRelationsController,
    // MediaResourcesController,
  ],
  providers: [
    PagesService,
    ContentGenerationService,
    PagesHelperService,
    PageConceptsService,
    ChatService,
    PageRelationsService,
  ],
  exports: [PagesService, ContentGenerationService, PageRelationsService],
})
export class PagesModule {}
