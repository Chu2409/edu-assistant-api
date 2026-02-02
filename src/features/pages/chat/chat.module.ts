import { Module } from '@nestjs/common'
import { AIModule } from 'src/providers/ai/ai.module'
import { ChatService } from './chat.service'
import { PageSessionsController } from './pages-sessions.controller'
import { SessionMessagesController } from './sessions-messages.controller'

@Module({
  imports: [AIModule],
  controllers: [PageSessionsController, SessionMessagesController],
  providers: [ChatService],
})
export class ChatModule {}
