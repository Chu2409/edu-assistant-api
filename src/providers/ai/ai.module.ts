import { Module } from '@nestjs/common'
import { OpenaiService } from './services/openai.service'
import { AiConfigController } from './ai-config.controller'
import { AiConfigService } from './services/ai-config.service'

@Module({
  controllers: [AiConfigController],
  providers: [OpenaiService, AiConfigService],
  exports: [OpenaiService],
})
export class AIModule {}
