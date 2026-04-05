import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger'
import { LoService } from './lo.service'
import { CreateLoDto } from './dtos/req/create-lo.dto'
import { UpdateLoDto } from './dtos/req/update-lo.dto'
import { UpdateLoContentDto } from './dtos/req/update-lo-content.dto'
import { ReorderLoDto } from './dtos/req/reorder-lo.dto'
import { LoDto } from './dtos/res/lo.dto'
import { BaseParamsReqDto } from 'src/shared/dtos/req/base-params.dto'
import { JwtAuth } from 'src/features/auth/decorators/jwt-auth.decorator'
import { GetUser } from 'src/features/auth/decorators/get-user.decorator'
import { Role, type User } from 'src/core/database/generated/client'
import {
  ApiPaginatedResponse,
  ApiStandardResponse,
} from 'src/shared/decorators/api-standard-response.decorator'
import { ApiPaginatedRes } from 'src/shared/dtos/res/api-response.dto'
import { FullLoDto } from './dtos/res/full-lo.dto'

@ApiTags('Learning Objects')
@Controller('learning-objects')
export class LoController {
  constructor(private readonly loService: LoService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo objeto de aprendizaje',
    description:
      'Solo el profesor propietario del módulo puede crear objetos de aprendizaje',
  })
  @ApiStandardResponse(LoDto, HttpStatus.CREATED)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({
    status: 403,
    description:
      'Solo el profesor propietario puede crear objetos de aprendizaje',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un objeto de aprendizaje con ese índice de orden',
  })
  @JwtAuth(Role.TEACHER)
  create(
    @Body() createLoDto: CreateLoDto,
    @GetUser() user: User,
  ): Promise<LoDto> {
    return this.loService.create(createLoDto, user)
  }

  @Get('module/:moduleId')
  @ApiOperation({
    summary: 'Listar todos los objetos de aprendizaje de un módulo',
    description:
      'El profesor puede ver todos los objetos de aprendizaje, el estudiante solo los publicados',
  })
  @ApiParam({
    name: 'moduleId',
    description: 'ID del módulo',
    example: 1,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'programación',
  })
  @ApiPaginatedResponse(LoDto)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Módulo no encontrado' })
  @ApiResponse({
    status: 403,
    description:
      'Sin permisos para ver los objetos de aprendizaje de este módulo',
  })
  findAll(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Query() params: BaseParamsReqDto,
    @GetUser() user: User,
  ): Promise<ApiPaginatedRes<LoDto>> {
    return this.loService.findAll(moduleId, params, user)
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un objeto de aprendizaje por ID',
    description:
      'Solo el profesor propietario, estudiante inscrito o módulo público pueden acceder',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del objeto de aprendizaje',
    example: 1,
  })
  @ApiStandardResponse(FullLoDto)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 404,
    description: 'Objeto de aprendizaje no encontrado',
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para ver este objeto de aprendizaje',
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<FullLoDto> {
    return this.loService.findOne(id, user)
  }

  @Patch('reorder')
  @ApiOperation({
    summary: 'Reordenar objetos de aprendizaje',
    description:
      'Actualiza los índices de orden de múltiples objetos de aprendizaje. Solo el profesor propietario puede reordenar objetos de aprendizaje',
  })
  @ApiStandardResponse(undefined, HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 404,
    description: 'Uno o más objetos de aprendizaje no encontrados',
  })
  @ApiResponse({
    status: 403,
    description:
      'Solo el profesor propietario puede reordenar objetos de aprendizaje',
  })
  @JwtAuth(Role.TEACHER)
  async reorder(
    @Body() reorderLosDto: ReorderLoDto,
    @GetUser() user: User,
  ): Promise<void> {
    return this.loService.reorder(reorderLosDto, user)
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un objeto de aprendizaje',
    description:
      'Solo el profesor propietario puede actualizar el objeto de aprendizaje',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del objeto de aprendizaje',
    example: 1,
  })
  @ApiStandardResponse(LoDto)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 404,
    description: 'Objeto de aprendizaje no encontrado',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo el profesor propietario puede actualizar',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un objeto de aprendizaje con ese índice de orden',
  })
  @JwtAuth(Role.TEACHER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLoDto: UpdateLoDto,
    @GetUser() user: User,
  ): Promise<LoDto> {
    return this.loService.update(id, updateLoDto, user)
  }

  @Patch(':id/content')
  @ApiOperation({
    summary: 'Actualizar el contenido (bloques) de un objeto de aprendizaje',
    description:
      'Permite crear, actualizar o reemplazar los bloques de contenido de un objeto de aprendizaje. Si un bloque tiene ID, se actualiza; si no, se crea. Los bloques que no estén en la lista se eliminan.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del objeto de aprendizaje',
    example: 1,
  })
  @ApiStandardResponse(LoDto)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 404,
    description: 'Objeto de aprendizaje no encontrado',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo el profesor propietario puede actualizar the contenido',
  })
  @JwtAuth(Role.TEACHER)
  updateContent(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLoContentDto: UpdateLoContentDto,
    @GetUser() user: User,
  ): Promise<LoDto> {
    return this.loService.updateContent(id, updateLoContentDto, user)
  }
}
