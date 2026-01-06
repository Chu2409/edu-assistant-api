import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger'
import { EnrollmentsService } from './enrollments.service'
import { CreateEnrollmentDto } from './dtos/req/create-enrollment.dto'
import { UpdateEnrollmentDto } from './dtos/req/update-enrollment.dto'
import { BulkEnrollStudentsDto } from './dtos/req/bulk-enroll-students.dto'
import { EnrollmentDto } from './dtos/res/enrollment.dto'
import { BaseParamsReqDto } from 'src/shared/dtos/req/base-params.dto'
import { JwtAuth } from 'src/features/auth/decorators/jwt-auth.decorator'
import { GetUser } from 'src/features/auth/decorators/get-user.decorator'
import { Role, type User } from 'src/core/database/generated/client'
import { ApiStandardResponse } from 'src/shared/decorators/api-standard-response.decorator'

@ApiTags('Enrollments')
@Controller('enrollments')
@JwtAuth()
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post('self')
  @ApiOperation({ summary: 'Inscribirse a un módulo (auto-inscripción)' })
  @ApiStandardResponse(EnrollmentDto, HttpStatus.CREATED)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'El módulo no permite auto-inscripción',
  })
  @ApiResponse({ status: 404, description: 'Módulo no encontrado' })
  @ApiResponse({ status: 409, description: 'Ya estás inscrito en este módulo' })
  selfEnroll(
    @Body() createEnrollmentDto: CreateEnrollmentDto,
    @GetUser() user: User,
  ): Promise<EnrollmentDto> {
    return this.enrollmentsService.selfEnroll(createEnrollmentDto, user)
  }

  @Post('bulk')
  @JwtAuth(Role.TEACHER)
  @ApiOperation({
    summary: 'Inscribir múltiples estudiantes a un módulo (solo profesores)',
  })
  @ApiStandardResponse([EnrollmentDto], HttpStatus.CREATED)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Solo profesores pueden inscribir estudiantes',
  })
  @ApiResponse({
    status: 404,
    description: 'Módulo o estudiantes no encontrados',
  })
  bulkEnrollStudents(
    @Body() bulkEnrollDto: BulkEnrollStudentsDto,
    @GetUser() user: User,
  ): Promise<EnrollmentDto[]> {
    return this.enrollmentsService.bulkEnrollStudents(bulkEnrollDto, user)
  }

  @Get('my')
  @ApiOperation({ summary: 'Listar mis inscripciones' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiStandardResponse([EnrollmentDto])
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findMyEnrollments(
    @Query() params: BaseParamsReqDto,
    @GetUser() user: User,
  ): Promise<EnrollmentDto[]> {
    return this.enrollmentsService.findMyEnrollments(params, user)
  }

  @Get('module/:moduleId')
  @JwtAuth(Role.TEACHER)
  @ApiOperation({
    summary: 'Listar estudiantes inscritos en un módulo (solo profesores)',
  })
  @ApiParam({
    name: 'moduleId',
    description: 'ID del módulo',
    example: 'clx1234567890',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiStandardResponse([EnrollmentDto])
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Solo el profesor propietario puede ver las inscripciones',
  })
  @ApiResponse({ status: 404, description: 'Módulo no encontrado' })
  findModuleEnrollments(
    @Param('moduleId') moduleId: string,
    @Query() params: BaseParamsReqDto,
    @GetUser() user: User,
  ): Promise<EnrollmentDto[]> {
    return this.enrollmentsService.findModuleEnrollments(moduleId, params, user)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una inscripción por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID de la inscripción',
    example: 'clx1234567890',
  })
  @ApiStandardResponse(EnrollmentDto)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'No tienes permisos para ver esta inscripción',
  })
  @ApiResponse({ status: 404, description: 'Inscripción no encontrada' })
  findOne(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<EnrollmentDto> {
    return this.enrollmentsService.findOne(id, user)
  }

  @Patch(':id')
  @JwtAuth(Role.TEACHER)
  @ApiOperation({ summary: 'Actualizar una inscripción (solo profesores)' })
  @ApiParam({
    name: 'id',
    description: 'ID de la inscripción',
    example: 'clx1234567890',
  })
  @ApiStandardResponse(EnrollmentDto)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Solo el profesor propietario puede actualizar',
  })
  @ApiResponse({ status: 404, description: 'Inscripción no encontrada' })
  update(
    @Param('id') id: string,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto,
    @GetUser() user: User,
  ): Promise<EnrollmentDto> {
    return this.enrollmentsService.update(id, updateEnrollmentDto, user)
  }

  @Delete('self/:moduleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desinscribirse de un módulo' })
  @ApiParam({
    name: 'moduleId',
    description: 'ID del módulo',
    example: 'clx1234567890',
  })
  @ApiResponse({ status: 204, description: 'Desinscripción exitosa' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'No estás inscrito en este módulo' })
  selfUnenroll(
    @Param('moduleId') moduleId: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.enrollmentsService.selfUnenroll(moduleId, user)
  }

  @Delete(':id')
  @JwtAuth(Role.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una inscripción (solo profesores)' })
  @ApiParam({
    name: 'id',
    description: 'ID de la inscripción',
    example: 'clx1234567890',
  })
  @ApiResponse({
    status: 204,
    description: 'Inscripción eliminada exitosamente',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Solo el profesor propietario puede eliminar',
  })
  @ApiResponse({ status: 404, description: 'Inscripción no encontrada' })
  remove(@Param('id') id: string, @GetUser() user: User): Promise<void> {
    return this.enrollmentsService.remove(id, user)
  }
}
