import { Module } from '@nestjs/common'
import { MediaResourcesController } from './media-resources.controller'
import { MediaResourcesService } from './media-resources.service'

@Module({
  controllers: [MediaResourcesController],
  providers: [MediaResourcesService],
})
export class MediaResourcesModule {}
