import { Module } from '@nestjs/common'
import { PagesActivitiesController } from './activities/pages-activities.controller'
import { ActivityAttemptsController } from './activities/activity-attempts.controller'
import { ActivitiesService } from './activities/activities.service'
import { PageFeedbacksController } from './page-feedbacks/page-feedbacks.controller'
import { PageFeedbacksService } from './page-feedbacks/page-feedbacks.service'
import { QuestionRepliesController } from './question-replies/question-replies.controller'
import { QuestionRepliesService } from './question-replies/question-replies.service'
import { StudentQuestionsController } from './student-questions/student-questions.controller'
import { StudentQuestionsService } from './student-questions/student-questions.service'
import { PageNotesController } from './notes/page-notes.controller'
import { PageNotesService } from './notes/page-notes.service'
import { PagesModule } from '../pages/pages.module'
import { PageSessionsController } from './chat/pages-sessions.controller'
import { SessionMessagesController } from './chat/sessions-messages.controller'
import { ChatService } from './chat/chat.service'
import { AIModule } from 'src/providers/ai/ai.module'

@Module({
  imports: [PagesModule, AIModule],
  controllers: [
    PagesActivitiesController,
    ActivityAttemptsController,
    PageFeedbacksController,
    QuestionRepliesController,
    StudentQuestionsController,
    PageNotesController,
    PageSessionsController,
    SessionMessagesController,
  ],
  providers: [
    ActivitiesService,
    PageFeedbacksService,
    QuestionRepliesService,
    StudentQuestionsService,
    PageNotesService,
    ChatService,
  ],
  exports: [],
})
export class InteractionsModule {}
