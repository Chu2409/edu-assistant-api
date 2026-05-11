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
import { LoProgressModule } from './lo-progress/lo-progress.module'
import { LoProgressController } from './lo-progress/lo-progress.controller'
import { LoProgressService } from './lo-progress/lo-progress.service'

@Module({
  imports: [LearningObjectsModule, LoProgressModule],
  controllers: [
    LoActivitiesController,
    ActivityAttemptsController,
    LoFeedbacksController,
    QuestionRepliesController,
    StudentQuestionsController,
    LoNotesController,
    LoProgressController,
  ],
  providers: [
    ActivitiesService,
    LoFeedbacksService,
    QuestionRepliesService,
    StudentQuestionsService,
    LoNotesService,
    LoProgressService,
  ],
  exports: [],
})
export class InteractionsModule {}
