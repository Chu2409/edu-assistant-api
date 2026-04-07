import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { LoTypesService } from './lo-types.service'
import { CreateLoTypeDto, UpdateLoTypeDto, LoTypeDto } from './dtos/lo-type.dto'
import { JwtAuth } from 'src/features/auth/decorators/jwt-auth.decorator'
import { RequireRoles } from 'src/features/auth/decorators/require-roles.decorator'
import { Role } from 'src/core/database/generated/client'

@ApiTags('Learning Object Types')
@Controller('learning-object-types')
@JwtAuth()
export class LoTypesController {
  constructor(private readonly loTypesService: LoTypesService) {}

  @Post()
  @RequireRoles(Role.ADMIN)
  @ApiOperation({
    summary: 'Crear un nuevo tipo de objeto de aprendizaje (ADMIN)',
  })
  @ApiResponse({ status: 201, type: LoTypeDto })
  create(@Body() createLoTypeDto: CreateLoTypeDto) {
    return this.loTypesService.create(createLoTypeDto)
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los tipos de objetos de aprendizaje' })
  @ApiResponse({ status: 200, type: [LoTypeDto] })
  findAll() {
    return this.loTypesService.findAll()
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un tipo de objeto de aprendizaje por ID' })
  @ApiResponse({ status: 200, type: LoTypeDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.loTypesService.findOne(id)
  }

  @Patch(':id')
  @RequireRoles(Role.ADMIN)
  @ApiOperation({
    summary: 'Actualizar un tipo de objeto de aprendizaje (ADMIN)',
  })
  @ApiResponse({ status: 200, type: LoTypeDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLoTypeDto: UpdateLoTypeDto,
  ) {
    return this.loTypesService.update(id, updateLoTypeDto)
  }

  @Delete(':id')
  @RequireRoles(Role.ADMIN)
  @ApiOperation({
    summary: 'Eliminar un tipo de objeto de aprendizaje (ADMIN)',
  })
  @ApiResponse({ status: 200, description: 'Tipo eliminado exitosamente' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.loTypesService.remove(id)
  }
}
