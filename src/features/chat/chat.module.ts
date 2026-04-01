import { Module } from '@nestjs/common'
import { ChatRateLimitService } from './services/chat-rate-limit.service'
import { ChatRateLimitGuard } from './guards/chat-rate-limit.guard'
import { AIModule } from 'src/providers/ai/ai.module'
import { LearningObjectsModule } from 'src/features/learning-objects/learning-objects.module'
import { SessionMessagesController } from './sessions-messages.controller'
import { LoSessionsController } from './lo-sessions.controller'
import { ChatService } from './chat.service'

@Module({
  imports: [AIModule, LearningObjectsModule],
  controllers: [SessionMessagesController, LoSessionsController],
  providers: [ChatService, ChatRateLimitService, ChatRateLimitGuard],
  exports: [ChatService],
})
export class ChatModule {}
