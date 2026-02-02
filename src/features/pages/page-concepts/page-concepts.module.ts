import { Module } from '@nestjs/common'
import { PageConceptsController } from './page-concepts.controller'
import { PageConceptsService } from './page-concepts.service'
import { ContentGenerationService } from '../content-generation/content-generation.service'
import { AIModule } from 'src/providers/ai/ai.module'

@Module({
  imports: [AIModule],
  controllers: [PageConceptsController],
  providers: [PageConceptsService, ContentGenerationService],
  exports: [PageConceptsService],
})
export class PageConceptsModule {}
