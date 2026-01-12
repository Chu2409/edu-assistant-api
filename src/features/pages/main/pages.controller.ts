import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { PagesService } from './pages.service'
import { CreatePageDto } from './dtos/req/create-page.dto'
import { UpdatePageDto } from './dtos/req/update-page.dto'
import { PageDto } from './dtos/res/page.dto'
import { BaseParamsReqDto } from 'src/shared/dtos/req/base-params.dto'
import { JwtAuth } from 'src/features/auth/decorators/jwt-auth.decorator'
import { GetUser } from 'src/features/auth/decorators/get-user.decorator'
import { Role, type User } from 'src/core/database/generated/client'
import {
  ApiPaginatedResponse,
  ApiStandardResponse,
} from 'src/shared/decorators/api-standard-response.decorator'
import { ApiPaginatedRes } from 'src/shared/dtos/res/api-response.dto'

@ApiTags('Pages')
@Controller('pages')
@JwtAuth()
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear una nueva página',
    description: 'Solo el profesor propietario del módulo puede crear páginas',
  })
  @ApiStandardResponse(PageDto, HttpStatus.CREATED)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({
    status: 403,
    description: 'Solo el profesor propietario puede crear páginas',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una página con ese índice de orden',
  })
  @JwtAuth(Role.TEACHER)
  create(
    @Body() createPageDto: CreatePageDto,
    @GetUser() user: User,
  ): Promise<PageDto> {
    return this.pagesService.create(createPageDto, user)
  }

  @Get('module/:moduleId')
  @ApiOperation({
    summary: 'Listar todas las páginas de un módulo',
    description:
      'El profesor puede ver todas las páginas, el estudiante solo las publicadas',
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
  @ApiPaginatedResponse(PageDto)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Módulo no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para ver las páginas de este módulo',
  })
  findAll(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Query() params: BaseParamsReqDto,
    @GetUser() user: User,
  ): Promise<ApiPaginatedRes<PageDto>> {
    return this.pagesService.findAll(moduleId, params, user)
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener una página por ID',
    description:
      'Solo el profesor propietario, estudiante inscrito o módulo público pueden acceder',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la página',
    example: 1,
  })
  @ApiStandardResponse(PageDto)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Página no encontrada' })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para ver esta página',
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<PageDto> {
    return this.pagesService.findOne(id, user)
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar una página',
    description: 'Solo el profesor propietario puede actualizar la página',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la página',
    example: 1,
  })
  @ApiStandardResponse(PageDto)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Página no encontrada' })
  @ApiResponse({
    status: 403,
    description: 'Solo el profesor propietario puede actualizar',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una página con ese índice de orden',
  })
  @JwtAuth(Role.TEACHER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePageDto: UpdatePageDto,
    @GetUser() user: User,
  ): Promise<PageDto> {
    return this.pagesService.update(id, updatePageDto, user)
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar una página',
    description: 'Solo el profesor propietario puede eliminar la página',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la página',
    example: 1,
  })
  @ApiResponse({ status: 204, description: 'Página eliminada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Página no encontrada' })
  @ApiResponse({
    status: 403,
    description: 'Solo el profesor propietario puede eliminar',
  })
  @JwtAuth(Role.TEACHER)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<void> {
    return this.pagesService.remove(id, user)
  }
}
