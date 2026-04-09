import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common'
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { GetUser } from 'src/features/auth/decorators/get-user.decorator'
import { JwtAuth } from 'src/features/auth/decorators/jwt-auth.decorator'
import { Role } from 'src/core/database/generated/enums'
import { TeacherFeedbackService } from './teacher-feedback.service'
import { TeacherFeedbackDto } from './dtos/res/teacher-feedback.dto'
import { ListTeacherFeedbackDto } from './dtos/req/list-teacher-feedback.dto'

@ApiTags('Teacher AI Feedback')
@Controller('modules/:moduleId/teacher-feedback')
@JwtAuth(Role.TEACHER)
export class TeacherFeedbackController {
  constructor(
    private readonly teacherFeedbackService: TeacherFeedbackService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar feedbacks pedagógicos generados por IA del módulo',
  })
  @ApiResponse({ status: 200, type: [TeacherFeedbackDto] })
  @ApiForbiddenResponse({ description: 'No eres el profesor de este módulo' })
  list(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @GetUser('id') teacherId: number,
    @Query() query: ListTeacherFeedbackDto,
  ) {
    return this.teacherFeedbackService.listByModule(moduleId, teacherId, query)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver un feedback pedagógico específico' })
  @ApiResponse({ status: 200, type: TeacherFeedbackDto })
  @ApiNotFoundResponse({ description: 'Feedback no encontrado' })
  @ApiForbiddenResponse({ description: 'No eres el profesor de este módulo' })
  findOne(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') teacherId: number,
  ) {
    return this.teacherFeedbackService.findOne(moduleId, id, teacherId)
  }

  @Post('generate')
  @ApiOperation({
    summary: 'Generar feedback pedagógico manualmente para un módulo',
  })
  @ApiResponse({ status: 201, description: 'Generación iniciada' })
  @ApiForbiddenResponse({ description: 'No eres el profesor de este módulo' })
  async generate(@Param('moduleId', ParseIntPipe) moduleId: number) {
    // Validar ownership antes de generar
    await this.teacherFeedbackService.generateForModule(moduleId)
    return { message: 'Feedback generado correctamente' }
  }
}
