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
import { ModulesService } from './modules.service'
import { CreateModuleDto } from './dtos/req/create-module.dto'
import { UpdateModuleDto } from './dtos/req/update-module.dto'
import { ModuleDto } from './dtos/res/module.dto'
import { BaseParamsReqDto } from 'src/shared/dtos/req/base-params.dto'
import { JwtAuth } from 'src/features/auth/decorators/jwt-auth.decorator'
import { GetUser } from 'src/features/auth/decorators/get-user.decorator'
import { Role, type User } from 'src/core/database/generated/client'
import { ApiStandardResponse } from 'src/shared/decorators/api-standard-response.decorator'

@ApiTags('Modules')
@Controller('modules')
@JwtAuth()
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo módulo' })
  @ApiStandardResponse(ModuleDto, HttpStatus.CREATED)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @JwtAuth(Role.TEACHER)
  create(
    @Body() createModuleDto: CreateModuleDto,
    @GetUser() user: User,
  ): Promise<ModuleDto> {
    return this.modulesService.create(createModuleDto, user)
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los módulos' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiStandardResponse([ModuleDto])
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findAll(
    @Query() params: BaseParamsReqDto,
    @GetUser() user: User,
  ): Promise<ModuleDto[]> {
    return this.modulesService.findAll(params, user)
  }

  @Get('my-enrolled')
  @ApiOperation({ summary: 'Listar módulos donde estoy inscrito' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiStandardResponse([ModuleDto])
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findMyEnrolledModules(
    @Query() params: BaseParamsReqDto,
    @GetUser() user: User,
  ): Promise<ModuleDto[]> {
    return this.modulesService.findMyEnrolledModules(params, user)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un módulo por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID del módulo',
    example: 'clx1234567890',
  })
  @ApiStandardResponse(ModuleDto)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Módulo no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para acceder al módulo',
  })
  findOne(@Param('id') id: string, @GetUser() user: User): Promise<ModuleDto> {
    return this.modulesService.findOne(id, user)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un módulo' })
  @ApiParam({
    name: 'id',
    description: 'ID del módulo',
    example: 'clx1234567890',
  })
  @ApiStandardResponse(ModuleDto)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Módulo no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'Solo el profesor propietario puede actualizar',
  })
  @JwtAuth(Role.TEACHER)
  update(
    @Param('id') id: string,
    @Body() updateModuleDto: UpdateModuleDto,
    @GetUser() user: User,
  ): Promise<ModuleDto> {
    return this.modulesService.update(id, updateModuleDto, user)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un módulo' })
  @ApiParam({
    name: 'id',
    description: 'ID del módulo',
    example: 'clx1234567890',
  })
  @ApiResponse({ status: 204, description: 'Módulo eliminado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Módulo no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'Solo el profesor propietario puede eliminar',
  })
  @JwtAuth(Role.TEACHER)
  remove(@Param('id') id: string, @GetUser() user: User): Promise<void> {
    return this.modulesService.remove(id, user)
  }
}
