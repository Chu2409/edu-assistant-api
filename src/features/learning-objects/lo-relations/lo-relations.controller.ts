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
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuth } from 'src/features/auth/decorators/jwt-auth.decorator'
import { GetUser } from 'src/features/auth/decorators/get-user.decorator'
import { Role, type User } from 'src/core/database/generated/client'
import { ApiStandardResponse } from 'src/shared/decorators/api-standard-response.decorator'
import { LoRelationsService } from './lo-relations.service'
import { LoRelationDto } from './dtos/res/lo-relation.dto'
import { CreateLoRelationDto } from './dtos/req/create-lo-relation.dto'
import { UpdateLoRelationDto } from './dtos/req/update-lo-relation.dto'

@ApiTags('Learning Object Relations')
@Controller('learning-objects')
@JwtAuth(Role.TEACHER)
export class LoRelationsController {
  constructor(private readonly loRelationsService: LoRelationsService) {}

  @Post(':learningObjectId/relations')
  @ApiOperation({ summary: 'Crear relación manualmente' })
  @ApiParam({ name: 'learningObjectId', type: Number, example: 1 })
  @ApiStandardResponse(LoRelationDto, HttpStatus.CREATED)
  @ApiResponse({ status: 403, description: 'Solo profesores' })
  create(
    @Param('learningObjectId', ParseIntPipe) learningObjectId: number,
    @Body() dto: CreateLoRelationDto,
    @GetUser() user: User,
  ): Promise<LoRelationDto> {
    return this.loRelationsService.create(learningObjectId, dto, user)
  }

  @Patch(':learningObjectId/relations/:relationId')
  @ApiOperation({ summary: 'Actualizar relación' })
  @ApiParam({ name: 'learningObjectId', type: Number, example: 1 })
  @ApiParam({ name: 'relationId', type: Number, example: 1 })
  @ApiStandardResponse(LoRelationDto)
  @ApiResponse({ status: 403, description: 'Solo profesores' })
  update(
    @Param('learningObjectId', ParseIntPipe) learningObjectId: number,
    @Param('relationId', ParseIntPipe) relationId: number,
    @Body() dto: UpdateLoRelationDto,
    @GetUser() user: User,
  ): Promise<LoRelationDto> {
    return this.loRelationsService.update(
      learningObjectId,
      relationId,
      dto,
      user,
    )
  }

  @Delete(':learningObjectId/relations/:relationId')
  @ApiOperation({ summary: 'Eliminar relación' })
  @ApiParam({ name: 'learningObjectId', type: Number, example: 1 })
  @ApiParam({ name: 'relationId', type: Number, example: 1 })
  @ApiStandardResponse(undefined, HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 403, description: 'Solo profesores' })
  delete(
    @Param('learningObjectId', ParseIntPipe) learningObjectId: number,
    @Param('relationId', ParseIntPipe) relationId: number,
    @GetUser() user: User,
  ): Promise<void> {
    return this.loRelationsService.delete(learningObjectId, relationId, user)
  }
}
