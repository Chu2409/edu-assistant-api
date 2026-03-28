import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common'
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GetUser } from 'src/features/auth/decorators/get-user.decorator'
import type { User } from 'src/core/database/generated/client'
import { ApiStandardResponse } from 'src/shared/decorators/api-standard-response.decorator'
import { ChatService } from './chat.service'
import { SendMessageDto } from './dtos/req/send-message.dto'
import { MessageDto } from './dtos/res/message.dto'
import { ChatMessageCreatedDto } from './dtos/res/chat-message-created.dto'

@ApiTags('Page Chat')
@Controller('sessions')
export class SessionMessagesController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':sessionId/messages')
  @ApiOperation({ summary: 'Listar mensajes de una sesión' })
  @ApiParam({ name: 'sessionId', type: Number, example: 1 })
  @ApiStandardResponse([MessageDto])
  list(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @GetUser() user: User,
  ): Promise<MessageDto[]> {
    return this.chatService.listMessages(sessionId, user)
  }

  @Post(':sessionId/messages')
  @ApiOperation({ summary: 'Enviar mensaje y obtener respuesta del asistente' })
  @ApiParam({ name: 'sessionId', type: Number, example: 1 })
  @ApiStandardResponse(ChatMessageCreatedDto, HttpStatus.CREATED)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  send(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() dto: SendMessageDto,
    @GetUser() user: User,
  ): Promise<ChatMessageCreatedDto> {
    return this.chatService.sendMessage(sessionId, dto, user)
  }
}
