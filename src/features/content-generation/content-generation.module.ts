import { Module } from '@nestjs/common'
import { ContentGenerationController } from './content-generation.controller'
import { PageContentService } from './page-content/page-content.service'
import { ConceptsService } from './concepts/concepts.service'
import { RelationsService } from './relations/relations.service'
import { ActivitiesService } from './activities/activities.service'
import { AIModule } from 'src/providers/ai/ai.module'
import { PagesModule } from '../learning-objects/pages.module'

@Module({
  imports: [AIModule, PagesModule],
  controllers: [ContentGenerationController],
  providers: [
    PageContentService,
    ConceptsService,
    RelationsService,
    ActivitiesService,
  ],
  exports: [
    PageContentService,
    ConceptsService,
    RelationsService,
    ActivitiesService,
  ],
})
export class ContentGenerationModule {}
