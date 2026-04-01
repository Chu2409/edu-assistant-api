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

@ApiTags('Page Feedbacks')
@Controller('page-feedbacks')
@JwtAuth(Role.STUDENT)
export class LoFeedbacksController {
  constructor(private readonly pageFeedbacksService: LoFeedbacksService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo feedback para una página' })
  @ApiResponse({ status: 201, type: LoFeedbackDto })
  create(
    @GetUser('id') userId: number,
    @Body() createPageFeedbackDto: CreateLoFeedbackDto,
  ) {
    return this.pageFeedbacksService.create(userId, createPageFeedbackDto)
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
    return this.pageFeedbacksService.update(+id, userId, updatePageFeedbackDto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un feedback' })
  @ApiResponse({ status: 200, type: LoFeedbackDto })
  @ApiNotFoundResponse({ description: 'Feedback no encontrado' })
  @ApiForbiddenResponse({
    description: 'El feedback no pertenece al estudiante',
  })
  remove(@Param('id') id: string, @GetUser('id') userId: number) {
    return this.pageFeedbacksService.delete(+id, userId)
  }
}
