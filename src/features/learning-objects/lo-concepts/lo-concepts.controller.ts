import {
  Body,
  Controller,
  Delete,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common'
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { JwtAuth } from 'src/features/auth/decorators/jwt-auth.decorator'
import { GetUser } from 'src/features/auth/decorators/get-user.decorator'
import { Role, type User } from 'src/core/database/generated/client'
import { ApiStandardResponse } from 'src/shared/decorators/api-standard-response.decorator'
import { LoConceptsService } from './lo-concepts.service'
import { LoConceptDto } from './dtos/res/lo-concept.dto'
import { CreateLoConceptDto } from './dtos/req/create-lo-concept.dto'
import { UpdateLoConceptDto } from './dtos/req/update-lo-concept.dto'

@ApiTags('Learning Object Concepts')
@Controller('learning-objects')
@JwtAuth(Role.TEACHER)
export class LoConceptsController {
  constructor(private readonly loConceptsService: LoConceptsService) {}

  @Post(':learningObjectId/concepts')
  @ApiOperation({ summary: 'Crear concepto manualmente' })
  @ApiParam({ name: 'learningObjectId', type: Number, example: 1 })
  @ApiStandardResponse(LoConceptDto, HttpStatus.CREATED)
  create(
    @Param('learningObjectId', ParseIntPipe) learningObjectId: number,
    @Body() dto: CreateLoConceptDto,
    @GetUser() user: User,
  ): Promise<LoConceptDto> {
    return this.loConceptsService.create(learningObjectId, dto, user)
  }

  @Patch(':learningObjectId/concepts/:conceptId')
  @ApiOperation({ summary: 'Actualizar concepto' })
  @ApiParam({ name: 'learningObjectId', type: Number, example: 1 })
  @ApiParam({ name: 'conceptId', type: Number, example: 1 })
  @ApiStandardResponse(LoConceptDto)
  update(
    @Param('learningObjectId', ParseIntPipe) learningObjectId: number,
    @Param('conceptId', ParseIntPipe) conceptId: number,
    @Body() dto: UpdateLoConceptDto,
    @GetUser() user: User,
  ): Promise<LoConceptDto> {
    return this.loConceptsService.update(learningObjectId, conceptId, dto, user)
  }

  @Delete(':learningObjectId/concepts/:conceptId')
  @ApiOperation({ summary: 'Eliminar concepto' })
  @ApiParam({ name: 'learningObjectId', type: Number, example: 1 })
  @ApiParam({ name: 'conceptId', type: Number, example: 1 })
  @ApiStandardResponse(undefined, HttpStatus.NO_CONTENT)
  async delete(
    @Param('learningObjectId', ParseIntPipe) learningObjectId: number,
    @Param('conceptId', ParseIntPipe) conceptId: number,
    @GetUser() user: User,
  ): Promise<void> {
    return this.loConceptsService.delete(learningObjectId, conceptId, user)
  }
}
