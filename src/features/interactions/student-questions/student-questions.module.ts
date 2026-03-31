import { Module } from '@nestjs/common'
import { StudentQuestionsController } from './student-questions.controller'
import { StudentQuestionsService } from './student-questions.service'
import { CoreModule } from 'src/core/core.module'

@Module({
  imports: [CoreModule],
  controllers: [StudentQuestionsController],
  providers: [StudentQuestionsService],
})
export class StudentQuestionsModule {}
