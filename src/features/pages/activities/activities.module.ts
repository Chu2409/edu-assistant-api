import { Module } from '@nestjs/common'
import { AIModule } from 'src/providers/ai/ai.module'
import { ActivitiesService } from './activities.service'
import { PagesActivitiesController } from './pages-activities.controller'
import { ActivityAttemptsController } from './activity-attempts.controller'

@Module({
  imports: [AIModule],
  controllers: [PagesActivitiesController, ActivityAttemptsController],
  providers: [ActivitiesService],
})
export class ActivitiesModule {}
