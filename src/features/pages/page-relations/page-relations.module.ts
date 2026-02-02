import { Module } from '@nestjs/common'
import { AIModule } from 'src/providers/ai/ai.module'
import { PageRelationsController } from './page-relations.controller'
import { PageRelationsService } from './page-relations.service'

@Module({
  imports: [AIModule],
  controllers: [PageRelationsController],
  providers: [PageRelationsService],
})
export class PageRelationsModule {}
