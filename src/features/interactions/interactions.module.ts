import { Module } from '@nestjs/common'
import { LoActivitiesController } from './activities/lo-activities.controller'
import { ActivityAttemptsController } from './activities/activity-attempts.controller'
import { ActivitiesService } from './activities/activities.service'
import { LoFeedbacksController } from './lo-feedbacks/lo-feedbacks.controller'
import { LoFeedbacksService } from './lo-feedbacks/lo-feedbacks.service'
import { QuestionRepliesController } from './question-replies/question-replies.controller'
import { QuestionRepliesService } from './question-replies/question-replies.service'
import { StudentQuestionsController } from './student-questions/student-questions.controller'
import { StudentQuestionsService } from './student-questions/student-questions.service'
import { LoNotesController } from './notes/lo-notes.controller'
import { LoNotesService } from './notes/lo-notes.service'
import { LearningObjectsModule } from '../learning-objects/learning-objects.module'

@Module({
  imports: [LearningObjectsModule],
  controllers: [
    LoActivitiesController,
    ActivityAttemptsController,
    LoFeedbacksController,
    QuestionRepliesController,
    StudentQuestionsController,
    LoNotesController,
  ],
  providers: [
    ActivitiesService,
    LoFeedbacksService,
    QuestionRepliesService,
    StudentQuestionsService,
    LoNotesService,
  ],
  exports: [],
})
export class InteractionsModule {}
