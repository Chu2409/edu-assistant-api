import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { GetUser } from 'src/features/auth/decorators/get-user.decorator'
import { PageFeedbacksService } from './page-feedbacks.service'
import { CreatePageFeedbackDto } from './dtos/req/create-page-feedback.dto'
import { UpdatePageFeedbackDto } from './dtos/req/update-page-feedback.dto'
import { JwtAuth } from 'src/features/auth/decorators/jwt-auth.decorator'
import { PageFeedbackDto } from './dtos/res/page-feedback.dto'
import { Role } from 'src/core/database/generated/enums'

@ApiTags('Page Feedbacks')
@ApiBearerAuth()
@Controller('page-feedbacks')
@JwtAuth(Role.STUDENT)
export class PageFeedbacksController {
  constructor(private readonly pageFeedbacksService: PageFeedbacksService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo feedback para una página' })
  @ApiResponse({ status: 201, type: PageFeedbackDto })
  create(
    @GetUser('id') userId: number,
    @Body() createPageFeedbackDto: CreatePageFeedbackDto,
  ) {
    return this.pageFeedbacksService.create(userId, createPageFeedbackDto)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un feedback existente' })
  @ApiResponse({ status: 200, type: PageFeedbackDto })
  @ApiNotFoundResponse({ description: 'Feedback no encontrado' })
  @ApiForbiddenResponse({
    description: 'El feedback no pertenece al estudiante',
  })
  update(
    @Param('id') id: string,
    @GetUser('id') userId: number,
    @Body() updatePageFeedbackDto: UpdatePageFeedbackDto,
  ) {
    return this.pageFeedbacksService.update(+id, userId, updatePageFeedbackDto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un feedback' })
  @ApiResponse({ status: 200, type: PageFeedbackDto })
  @ApiNotFoundResponse({ description: 'Feedback no encontrado' })
  @ApiForbiddenResponse({
    description: 'El feedback no pertenece al estudiante',
  })
  remove(@Param('id') id: string, @GetUser('id') userId: number) {
    return this.pageFeedbacksService.delete(+id, userId)
  }
}
