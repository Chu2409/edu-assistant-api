import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger'
import { EnrollmentsService } from './enrollments.service'
import { CreateEnrollmentDto } from './dtos/req/create-enrollment.dto'
import { UpdateEnrollmentDto } from './dtos/req/update-enrollment.dto'
import { BulkEnrollStudentsDto } from './dtos/req/bulk-enroll-students.dto'
import { EnrollmentDto } from './dtos/res/enrollment.dto'
import { JwtAuth } from 'src/features/auth/decorators/jwt-auth.decorator'
import { GetUser } from 'src/features/auth/decorators/get-user.decorator'
import { Role, type User } from 'src/core/database/generated/client'
import { ApiStandardResponse } from 'src/shared/decorators/api-standard-response.decorator'
import { EnrollmentStudentsDto } from './dtos/res/enrollment-student.dto'

@ApiTags('Enrollments')
@Controller('enrollments')
@JwtAuth(Role.TEACHER)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post('self')
  @ApiOperation({
    summary: 'Inscribirse a un módulo (auto-inscripción)',
    description: 'El usuario se inscribe a sí mismo en un módulo',
  })
  @ApiStandardResponse(EnrollmentDto, HttpStatus.CREATED)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'El módulo no permite auto-inscripción',
  })
  @ApiResponse({ status: 404, description: 'Módulo no encontrado' })
  @ApiResponse({ status: 409, description: 'Ya estás inscrito en este módulo' })
  @JwtAuth(Role.STUDENT)
  selfEnroll(
    @Body() createEnrollmentDto: CreateEnrollmentDto,
    @GetUser() user: User,
  ): Promise<EnrollmentDto> {
    return this.enrollmentsService.selfEnroll(createEnrollmentDto, user)
  }

  @Post('bulk')
  @ApiOperation({
    summary: 'Inscribir múltiples estudiantes a un módulo (solo profesores)',
    description: 'El profesor inscribe a múltiples estudiantes en un módulo',
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

  @Get('module/:moduleId')
  @ApiOperation({
    summary: 'Listar estudiantes inscritos en un módulo (solo profesores)',
    description: 'El profesor puede ver los estudiantes inscritos en un módulo',
  })
  @ApiParam({
    name: 'moduleId',
    description: 'ID del módulo',
    example: 1,
  })
  @ApiStandardResponse([EnrollmentStudentsDto])
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Solo el profesor propietario puede ver las inscripciones',
  })
  @ApiResponse({ status: 404, description: 'Módulo no encontrado' })
  findModuleEnrollments(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @GetUser() user: User,
  ): Promise<EnrollmentStudentsDto[]> {
    return this.enrollmentsService.findModuleEnrollments(moduleId, user)
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar una inscripción (solo profesores)',
    description: 'El profesor puede actualizar una inscripción de un módulo',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la inscripción',
    example: 1,
  })
  @ApiStandardResponse(EnrollmentDto)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Solo el profesor propietario puede actualizar',
  })
  @ApiResponse({ status: 404, description: 'Inscripción no encontrada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto,
    @GetUser() user: User,
  ): Promise<EnrollmentDto> {
    return this.enrollmentsService.update(id, updateEnrollmentDto, user)
  }

  @Delete('self/:moduleId')
  @ApiOperation({
    summary: 'Desinscribirse de un módulo',
    description: 'El usuario se desinscribe a sí mismo de un módulo',
  })
  @ApiParam({
    name: 'moduleId',
    description: 'ID del módulo',
    example: 1,
  })
  @ApiStandardResponse(EnrollmentDto)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'No estás inscrito en este módulo' })
  @JwtAuth(Role.STUDENT)
  selfUnenroll(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @GetUser() user: User,
  ): Promise<EnrollmentDto> {
    return this.enrollmentsService.selfUnenroll(moduleId, user)
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar una inscripción (solo profesores)',
    description: 'El profesor elimina una inscripción de un módulo',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la inscripción',
    example: 1,
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Solo el profesor propietario puede eliminar',
  })
  @ApiResponse({ status: 404, description: 'Inscripción no encontrada' })
  @ApiStandardResponse(EnrollmentDto)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<EnrollmentDto> {
    return this.enrollmentsService.remove(id, user)
  }
}
