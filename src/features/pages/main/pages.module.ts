import { Module } from '@nestjs/common'
import { PagesController } from './pages.controller'
import { PagesService } from './pages.service'
import { ContentGenerationController } from '../content-generation/content-generation.controller'
import { ContentGenerationService } from '../content-generation/content-generation.service'
import { AIModule } from 'src/providers/ai/ai.module'
import { BullModule } from '@nestjs/bullmq'
import { QUEUE_NAMES } from 'src/shared/constants/queues'
import { PagesHelperService } from './pages-helper.service'
import { ActivityAttemptsController } from '../activities/activity-attempts.controller'
import { PagesActivitiesController } from '../activities/pages-activities.controller'
import { ActivitiesService } from '../activities/activities.service'
import { PageConceptsController } from '../page-concepts/page-concepts.controller'
import { PageConceptsService } from '../page-concepts/page-concepts.service'
import { PageSessionsController } from '../chat/pages-sessions.controller'
import { SessionMessagesController } from '../chat/sessions-messages.controller'
import { ChatService } from '../chat/chat.service'
import { PageRelationsController } from '../page-relations/page-relations.controller'
import { PageRelationsService } from '../page-relations/page-relations.service'
import { MediaResourcesController } from '../media-resources/media-resources.controller'
import { MediaResourcesService } from '../media-resources/media-resources.service'

@Module({
  imports: [
    AIModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.CONCEPTS.NAME,
    }),
  ],
  controllers: [
    PagesController,
    ContentGenerationController,
    PagesActivitiesController,
    ActivityAttemptsController,
    PageConceptsController,
    PageSessionsController,
    SessionMessagesController,
    PageRelationsController,
    MediaResourcesController,
  ],
  providers: [
    PagesService,
    ContentGenerationService,
    PagesHelperService,
    ActivitiesService,
    PageConceptsService,
    ChatService,
    PageRelationsService,
    MediaResourcesService,
  ],
  exports: [PagesService, ContentGenerationService],
})
export class PagesModule {}
