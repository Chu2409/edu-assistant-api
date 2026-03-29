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
import { StudentQuestionsService } from './student-questions.service'
import { CreateStudentQuestionDto } from './dtos/req/create-student-question.dto'
import { UpdateStudentQuestionDto } from './dtos/req/update-student-question.dto'
import { StudentQuestionDto } from './dtos/res/student-question.dto'
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { JwtAuth } from 'src/features/auth/decorators/jwt-auth.decorator'
import { Role } from 'src/core/database/generated/enums'

@ApiTags('Student Questions')
@Controller('pages/student-questions')
@JwtAuth(Role.STUDENT)
export class StudentQuestionsController {
  constructor(
    private readonly studentQuestionsService: StudentQuestionsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear pregunta de estudiante' })
  @ApiResponse({
    status: 201,
    description: 'La pregunta ha sido creada exitosamente',
    type: StudentQuestionDto,
  })
  async create(
    @GetUser('id') userId: number,
    @Body() createStudentQuestionDto: CreateStudentQuestionDto,
  ): Promise<StudentQuestionDto> {
    return this.studentQuestionsService.create(userId, createStudentQuestionDto)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar pregunta de estudiante' })
  @ApiResponse({
    status: 200,
    description: 'La pregunta ha sido actualizada exitosamente',
    type: StudentQuestionDto,
  })
  @ApiForbiddenResponse({
    description: 'No tienes permiso para actualizar esta pregunta.',
  })
  @ApiNotFoundResponse({ description: 'Pregunta no encontrada.' })
  async update(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) questionId: number,
    @Body() updateStudentQuestionDto: UpdateStudentQuestionDto,
  ): Promise<StudentQuestionDto> {
    return this.studentQuestionsService.update(
      userId,
      questionId,
      updateStudentQuestionDto,
    )
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar pregunta de estudiante' })
  @ApiResponse({
    status: 200,
    description: 'La pregunta ha sido eliminada exitosamente.',
  })
  @ApiForbiddenResponse({
    description: 'No tienes permiso para eliminar esta pregunta.',
  })
  @ApiNotFoundResponse({ description: 'Pregunta no encontrada.' })
  async delete(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) questionId: number,
  ): Promise<void> {
    return this.studentQuestionsService.delete(userId, questionId)
  }
}
