import { Module } from '@nestjs/common'
import { PagesController } from './pages.controller'
import { PagesService } from './pages.service'
import { ContentGenerationController } from '../content-generation/content-generation.controller'
import { ContentGenerationService } from '../content-generation/content-generation.service'
import { HtmlProcessorService } from '../content-generation/html-processor.service'
import { AIModule } from 'src/providers/ai/ai.module'

@Module({
  imports: [AIModule],
  controllers: [PagesController, ContentGenerationController],
  providers: [PagesService, ContentGenerationService, HtmlProcessorService],
  exports: [PagesService],
})
export class PagesModule {}
