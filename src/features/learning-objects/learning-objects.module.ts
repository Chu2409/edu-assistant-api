import { Module } from '@nestjs/common'
import { LoController } from './main/lo.controller'
import { LoService } from './main/lo.service'
import { AIModule } from 'src/providers/ai/ai.module'
import { LoHelperService } from './main/lo-helper.service'
import { LoConceptsController } from './lo-concepts/lo-concepts.controller'
import { LoConceptsService } from './lo-concepts/lo-concepts.service'
import { LoRelationsController } from './lo-relations/lo-relations.controller'
import { LoRelationsService } from './lo-relations/lo-relations.service'
import { BullModule } from '@nestjs/bullmq'
import { QUEUE_NAMES } from 'src/shared/constants/queues'

@Module({
  imports: [
    AIModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.EMBEDDINGS.NAME,
    }),
  ],
  controllers: [LoController, LoConceptsController, LoRelationsController],
  providers: [
    LoService,
    LoHelperService,
    LoConceptsService,
    LoRelationsService,
  ],
  exports: [LoService, LoRelationsService, LoHelperService],
})
export class LearningObjectsModule {}
