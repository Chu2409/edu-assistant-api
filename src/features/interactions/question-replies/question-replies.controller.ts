import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common'
import { GetUser } from 'src/features/auth/decorators/get-user.decorator'
import { QuestionRepliesService } from './question-replies.service'
import { CreateQuestionReplyDto } from './dtos/req/create-question-reply.dto'
import { UpdateQuestionReplyDto } from './dtos/req/update-question-reply.dto'
import { QuestionReplyDto } from './dtos/res/question-reply.dto'
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'

@ApiTags('Question Replies')
@Controller('pages/question-replies')
export class QuestionRepliesController {
  constructor(
    private readonly questionRepliesService: QuestionRepliesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear respuesta a una pregunta' })
  @ApiResponse({
    status: 201,
    description: 'La respuesta ha sido creada exitosamente',
    type: QuestionReplyDto,
  })
  @ApiNotFoundResponse({ description: 'La pregunta no existe.' })
  async create(
    @GetUser('id') userId: number,
    @Body() createQuestionReplyDto: CreateQuestionReplyDto,
  ): Promise<QuestionReplyDto> {
    return this.questionRepliesService.create(userId, createQuestionReplyDto)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar respuesta a una pregunta' })
  @ApiResponse({
    status: 200,
    description: 'La respuesta ha sido actualizada exitosamente',
    type: QuestionReplyDto,
  })
  @ApiForbiddenResponse({
    description: 'No tienes permiso para actualizar esta respuesta.',
  })
  @ApiNotFoundResponse({ description: 'Respuesta no encontrada.' })
  async update(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) replyId: number,
    @Body() updateQuestionReplyDto: UpdateQuestionReplyDto,
  ): Promise<QuestionReplyDto> {
    return this.questionRepliesService.update(
      userId,
      replyId,
      updateQuestionReplyDto,
    )
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar respuesta a una pregunta' })
  @ApiResponse({
    status: 200,
    description: 'La respuesta ha sido eliminada exitosamente.',
  })
  @ApiForbiddenResponse({
    description: 'No tienes permiso para eliminar esta respuesta.',
  })
  @ApiNotFoundResponse({ description: 'Respuesta no encontrada.' })
  async delete(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) replyId: number,
  ): Promise<void> {
    return this.questionRepliesService.delete(userId, replyId)
  }
}
