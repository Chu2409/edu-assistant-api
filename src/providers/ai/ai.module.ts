import { Module } from '@nestjs/common'
import { AIService } from './ai.service'
import { OpenaiService } from './openai.service'

@Module({
  providers: [AIService, OpenaiService],
  exports: [AIService, OpenaiService],
})
export class AIModule {}
