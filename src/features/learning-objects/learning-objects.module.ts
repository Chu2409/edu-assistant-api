import { Module } from '@nestjs/common'
import { LoController } from './main/lo.controller'
import { LoService } from './main/lo.service'
import { AIModule } from 'src/providers/ai/ai.module'
import { LoHelperService } from './main/lo-helper.service'
import { LoConceptsController } from './lo-concepts/lo-concepts.controller'
import { LoConceptsService } from './lo-concepts/lo-concepts.service'
import { LoRelationsController } from './lo-relations/lo-relations.controller'
import { LoRelationsService } from './lo-relations/lo-relations.service'
import { LoTypesController } from './lo-types/lo-types.controller'
import { LoTypesService } from './lo-types/lo-types.service'
import { BullModule } from '@nestjs/bullmq'
import { QUEUE_NAMES } from 'src/shared/constants/queues'
import { LoTypesModule } from './lo-types/lo-types.module'

@Module({
  imports: [
    AIModule,
    LoTypesModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.EMBEDDINGS.NAME,
    }),
  ],
  controllers: [
    LoController,
    LoConceptsController,
    LoRelationsController,
    LoTypesController,
  ],
  providers: [
    LoService,
    LoHelperService,
    LoConceptsService,
    LoRelationsService,
    LoTypesService,
  ],
  exports: [LoService, LoRelationsService, LoHelperService],
})
export class LearningObjectsModule {}
