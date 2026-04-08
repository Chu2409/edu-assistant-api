import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { LoTypesService } from './lo-types.service'
import { CreateLoTypeDto } from './dtos/req/create-lo-type.dto'
import { UpdateLoTypeDto } from './dtos/req/update-lo-type.dto'
import { LoTypeDto } from './dtos/res/lo-type.dto'
import { JwtAuth } from 'src/features/auth/decorators/jwt-auth.decorator'
import { Role } from 'src/core/database/generated/client'
import { ApiStandardResponse } from 'src/shared/decorators/api-standard-response.decorator'

@ApiTags('Learning Object Types')
@Controller('learning-object-types')
@JwtAuth()
export class LoTypesController {
  constructor(private readonly loTypesService: LoTypesService) {}

  @Post()
  @JwtAuth(Role.ADMIN)
  @ApiOperation({
    summary: 'Crear un nuevo tipo de objeto de aprendizaje (ADMIN)',
  })
  @ApiStandardResponse(LoTypeDto, HttpStatus.CREATED)
  create(@Body() createLoTypeDto: CreateLoTypeDto) {
    return this.loTypesService.create(createLoTypeDto)
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los tipos de objetos de aprendizaje' })
  @ApiStandardResponse([LoTypeDto])
  findAll() {
    return this.loTypesService.findAll()
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un tipo de objeto de aprendizaje por ID' })
  @ApiStandardResponse(LoTypeDto)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.loTypesService.findOne(id)
  }

  @Patch(':id')
  @JwtAuth(Role.ADMIN)
  @ApiOperation({
    summary: 'Actualizar un tipo de objeto de aprendizaje (ADMIN)',
  })
  @ApiStandardResponse(LoTypeDto)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLoTypeDto: UpdateLoTypeDto,
  ) {
    return this.loTypesService.update(id, updateLoTypeDto)
  }

  @Delete(':id')
  @JwtAuth(Role.ADMIN)
  @ApiOperation({
    summary: 'Eliminar un tipo de objeto de aprendizaje (ADMIN)',
  })
  @ApiStandardResponse(undefined, HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.loTypesService.remove(id)
  }
}
