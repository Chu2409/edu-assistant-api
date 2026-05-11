import { Module } from '@nestjs/common'
import { LoProgressController } from './lo-progress.controller'
import { LoProgressService } from './lo-progress.service'

@Module({
  controllers: [LoProgressController],
  providers: [LoProgressService],
  exports: [LoProgressService],
})
export class LoProgressModule {}
