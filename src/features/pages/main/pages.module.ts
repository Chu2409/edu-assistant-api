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
import { ChatService } from '../chat/chat.service'
import { PageRelationsController } from '../page-relations/page-relations.controller'
import { PageRelationsService } from '../page-relations/page-relations.service'
import { StudentQuestionsController } from '../student-questions/student-questions.controller'
import { StudentQuestionsService } from '../student-questions/student-questions.service'
import { PageNotesController } from '../notes/page-notes.controller'
import { PageNotesService } from '../notes/page-notes.service'
import { QuestionRepliesController } from '../question-replies/question-replies.controller'
import { QuestionRepliesService } from '../question-replies/question-replies.service'

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
    PagesActivitiesController,
    ActivityAttemptsController,
    PageConceptsController,
    // PageSessionsController,
    // SessionMessagesController,
    PageRelationsController,
    // MediaResourcesController,
    StudentQuestionsController,
    PageNotesController,
    QuestionRepliesController,
  ],
  providers: [
    PagesService,
    ContentGenerationService,
    PagesHelperService,
    ActivitiesService,
    PageConceptsService,
    ChatService,
    PageRelationsService,
    StudentQuestionsService,
    PageNotesService,
    QuestionRepliesService,
  ],
  exports: [PagesService, ContentGenerationService, PageRelationsService],
})
export class PagesModule {}
