import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common'
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { GetUser } from 'src/features/auth/decorators/get-user.decorator'
import { LoFeedbacksService } from './lo-feedbacks.service'
import { CreateLoFeedbackDto } from './dtos/req/create-lo-feedback.dto'
import { UpdateLoFeedbackDto } from './dtos/req/update-lo-feedback.dto'
import { JwtAuth } from 'src/features/auth/decorators/jwt-auth.decorator'
import { LoFeedbackDto } from './dtos/res/lo-feedback.dto'
import { Role } from 'src/core/database/generated/enums'

@ApiTags('Learning Object Feedbacks')
@Controller('learning-object-feedbacks')
@JwtAuth(Role.STUDENT)
export class LoFeedbacksController {
  constructor(private readonly loFeedbacksService: LoFeedbacksService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo feedback para un objeto de aprendizaje',
  })
  @ApiResponse({ status: 201, type: LoFeedbackDto })
  create(
    @GetUser('id') userId: number,
    @Body() createLoFeedbackDto: CreateLoFeedbackDto,
  ) {
    return this.loFeedbacksService.create(userId, createLoFeedbackDto)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un feedback existente' })
  @ApiResponse({ status: 200, type: LoFeedbackDto })
  @ApiNotFoundResponse({ description: 'Feedback no encontrado' })
  @ApiForbiddenResponse({
    description: 'El feedback no pertenece al estudiante',
  })
  update(
    @Param('id') id: string,
    @GetUser('id') userId: number,
    @Body() updatePageFeedbackDto: UpdateLoFeedbackDto,
  ) {
    return this.loFeedbacksService.update(+id, userId, updatePageFeedbackDto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un feedback' })
  @ApiResponse({ status: 200, type: LoFeedbackDto })
  @ApiNotFoundResponse({ description: 'Feedback no encontrado' })
  @ApiForbiddenResponse({
    description: 'El feedback no pertenece al estudiante',
  })
  remove(@Param('id') id: string, @GetUser('id') userId: number) {
    return this.loFeedbacksService.delete(+id, userId)
  }
}
