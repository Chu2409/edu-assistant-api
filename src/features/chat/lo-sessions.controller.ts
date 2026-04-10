import {
  Body,
  Controller,
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
import { CreateOrGetSessionDto } from './dtos/req/create-or-get-session.dto'
import { SessionDto } from './dtos/res/session.dto'

@ApiTags('Learning Object Chat')
@Controller('learning-objects')
export class LoSessionsController {
  constructor(private readonly chatService: ChatService) {}

  @Post(':learningObjectId/sessions')
  @ApiOperation({
    summary: 'Crear u obtener sesión de chat para un objeto de aprendizaje',
  })
  @ApiParam({ name: 'learningObjectId', type: Number, example: 1 })
  @ApiStandardResponse(SessionDto, HttpStatus.CREATED)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  createOrGet(
    @Param('learningObjectId', ParseIntPipe) learningObjectId: number,
    @Body() dto: CreateOrGetSessionDto,
    @GetUser() user: User,
  ): Promise<SessionDto> {
    return this.chatService.createOrGetSession(learningObjectId, dto, user)
  }
}
