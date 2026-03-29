import { Module } from '@nestjs/common'
import { ChatService } from './chat.service'
import { SessionMessagesController } from './sessions-messages.controller'
import { PageSessionsController } from './pages-sessions.controller'
import { ChatRateLimitService } from './services/chat-rate-limit.service'
import { ChatRateLimitGuard } from './guards/chat-rate-limit.guard'
import { AIModule } from 'src/providers/ai/ai.module'
import { PagesModule } from 'src/features/pages/pages.module'

@Module({
  imports: [AIModule, PagesModule],
  controllers: [SessionMessagesController, PageSessionsController],
  providers: [ChatService, ChatRateLimitService, ChatRateLimitGuard],
  exports: [ChatService],
})
export class ChatModule {}
