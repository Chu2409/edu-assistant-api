
import { Module } from '@nestjs/common';
import { PageFeedbacksController } from './page-feedbacks.controller';
import { PageFeedbacksService } from './page-feedbacks.service';

@Module({
  controllers: [PageFeedbacksController],
  providers: [PageFeedbacksService],
})
export class PageFeedbacksModule {}
