import { Module } from '@nestjs/common'
import { OpenaiService } from './openai.service'
import { AiConfigController } from './ai-config.controller'

@Module({
  controllers: [AiConfigController],
  providers: [OpenaiService],
  exports: [OpenaiService],
})
export class AIModule {}
