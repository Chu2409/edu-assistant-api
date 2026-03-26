import { Module } from '@nestjs/common'
import { ContentGenerationController } from './content-generation.controller'
import { ContentGenerationService } from './content-generation.service'
import { AIModule } from 'src/providers/ai/ai.module'
import { PagesModule } from '../pages/pages.module'

@Module({
  imports: [AIModule, PagesModule],
  controllers: [ContentGenerationController],
  providers: [ContentGenerationService],
  exports: [ContentGenerationService],
})
export class ContentGenerationModule {}
