import { Module } from '@nestjs/common'
import { PagesActivitiesController } from './activities/pages-activities.controller'
import { ActivityAttemptsController } from './activities/activity-attempts.controller'
import { ActivitiesService } from './activities/activities.service'
import { PageFeedbacksController } from './lo-feedbacks/page-feedbacks.controller'
import { PageFeedbacksService } from './lo-feedbacks/page-feedbacks.service'
import { QuestionRepliesController } from './question-replies/question-replies.controller'
import { QuestionRepliesService } from './question-replies/question-replies.service'
import { StudentQuestionsController } from './student-questions/student-questions.controller'
import { StudentQuestionsService } from './student-questions/student-questions.service'
import { PageNotesController } from './notes/page-notes.controller'
import { PageNotesService } from './notes/page-notes.service'
import { PagesModule } from '../learning-objects/pages.module'

@Module({
  imports: [PagesModule],
  controllers: [
    PagesActivitiesController,
    ActivityAttemptsController,
    PageFeedbacksController,
    QuestionRepliesController,
    StudentQuestionsController,
    PageNotesController,
  ],
  providers: [
    ActivitiesService,
    PageFeedbacksService,
    QuestionRepliesService,
    StudentQuestionsService,
    PageNotesService,
  ],
  exports: [],
})
export class InteractionsModule {}
