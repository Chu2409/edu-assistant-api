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
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger'
import { ModulesService } from './modules.service'
import { CreateModuleDto } from './dtos/req/create-module.dto'
import { UpdateModuleDto } from './dtos/req/update-module.dto'
import { ModuleDto } from './dtos/res/module.dto'
import { JwtAuth } from 'src/features/auth/decorators/jwt-auth.decorator'
import { GetUser } from 'src/features/auth/decorators/get-user.decorator'
import { Role, type User } from 'src/core/database/generated/client'
import {
  ApiPaginatedResponse,
  ApiStandardResponse,
} from 'src/shared/decorators/api-standard-response.decorator'
import {
  ModulesAllFiltersDto,
  ModulesAvailableFiltersDto,
} from './dtos/req/module-filters.dto'
import { ApiPaginatedRes } from 'src/shared/dtos/res/api-response.dto'

@ApiTags('Modules')
@Controller('modules')
@JwtAuth()
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo módulo',
    description: 'Solo el profesor puede crear un nuevo módulo',
  })
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
  @ApiOperation({
    summary: 'Obtener todos los módulos',
    description:
      'El profesor puede obtener todos los módulos, el estudiante puede obtener todos los módulos públicos y los módulos donde está inscrito',
  })
  @ApiPaginatedResponse(ModuleDto)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findAll(
    @Query() params: ModulesAllFiltersDto,
    @GetUser() user: User,
  ): Promise<ApiPaginatedRes<ModuleDto>> {
    return this.modulesService.findAll(params, user)
  }

  @Get('available')
  @JwtAuth(Role.STUDENT)
  @ApiOperation({
    summary: 'Listar módulos disponibles',
    description:
      'El estudiante puede obtener todos los módulos disponibles para inscribirse (excluyendo aquellos en los que ya está enrolado)',
  })
  @ApiPaginatedResponse(ModuleDto)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findModulesAvailable(
    @Query() params: ModulesAvailableFiltersDto,
    @GetUser() user: User,
  ): Promise<ApiPaginatedRes<ModuleDto>> {
    return this.modulesService.findModulesAvailable(params, user)
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un módulo por ID',
    description:
      'Solo el profesor propietario, estudiante inscrito o módulo público pueden acceder',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del módulo',
    example: 1,
  })
  @ApiStandardResponse(ModuleDto)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Módulo no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para acceder al módulo',
  })
  @JwtAuth(Role.TEACHER, Role.STUDENT)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<ModuleDto> {
    return this.modulesService.findOne(id, user)
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un módulo',
    description: 'Solo el profesor propietario puede actualizar el módulo',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del módulo',
    example: 1,
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
    @Param('id', ParseIntPipe) id: number,
    @Body() updateModuleDto: UpdateModuleDto,
    @GetUser() user: User,
  ): Promise<ModuleDto> {
    return this.modulesService.update(id, updateModuleDto, user)
  }

  // @Patch(':id/toggle-active')
  // @JwtAuth(Role.TEACHER)
  // @ApiOperation({
  //   summary: 'Alternar estado activo/inactivo de un módulo',
  //   description:
  //     'Alterna el estado isActive del módulo. Si está activo lo desactiva y viceversa. Solo el profesor propietario puede cambiar el estado.',
  // })
  // @ApiParam({
  //   name: 'id',
  //   description: 'ID del módulo',
  //   example: 1,
  // })
  // @ApiStandardResponse(ModuleDto)
  // @ApiResponse({ status: 401, description: 'No autorizado' })
  // @ApiResponse({ status: 404, description: 'Módulo no encontrado' })
  // @ApiResponse({
  //   status: 403,
  //   description: 'Solo el profesor propietario puede cambiar el estado',
  // })
  // toggleActive(
  //   @Param('id', ParseIntPipe) id: number,
  //   @GetUser() user: User,
  // ): Promise<ModuleDto> {
  //   return this.modulesService.toggleActive(id, user)
  // }
}
