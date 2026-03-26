import { Module } from '@nestjs/common'
import { PagesController } from './main/pages.controller'
import { PagesService } from './main/pages.service'
import { AIModule } from 'src/providers/ai/ai.module'
import { PagesHelperService } from './main/pages-helper.service'
import { PageConceptsController } from './page-concepts/page-concepts.controller'
import { PageConceptsService } from './page-concepts/page-concepts.service'
import { ChatService } from './chat/chat.service'
import { PageRelationsController } from './page-relations/page-relations.controller'
import { PageRelationsService } from './page-relations/page-relations.service'
import { PageSessionsController } from './chat/pages-sessions.controller'
import { SessionMessagesController } from './chat/sessions-messages.controller'
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
    PageSessionsController,
    SessionMessagesController,
    PageRelationsController,
  ],
  providers: [
    PagesService,
    PagesHelperService,
    PageConceptsService,
    ChatService,
    PageRelationsService,
  ],
  exports: [PagesService, PageRelationsService, PagesHelperService],
})
export class PagesModule {}
