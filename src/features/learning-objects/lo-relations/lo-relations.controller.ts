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

@ApiTags('Page Relations')
@Controller('pages')
@JwtAuth(Role.TEACHER)
export class LoRelationsController {
  constructor(private readonly pageRelationsService: LoRelationsService) {}

  @Post(':pageId/relations')
  @ApiOperation({ summary: 'Crear relación manualmente' })
  @ApiParam({ name: 'pageId', type: Number, example: 1 })
  @ApiStandardResponse(LoRelationDto, HttpStatus.CREATED)
  @ApiResponse({ status: 403, description: 'Solo profesores' })
  create(
    @Param('pageId', ParseIntPipe) pageId: number,
    @Body() dto: CreateLoRelationDto,
    @GetUser() user: User,
  ): Promise<LoRelationDto> {
    return this.pageRelationsService.create(pageId, dto, user)
  }

  @Patch(':pageId/relations/:relationId')
  @ApiOperation({ summary: 'Actualizar relación' })
  @ApiParam({ name: 'pageId', type: Number, example: 1 })
  @ApiParam({ name: 'relationId', type: Number, example: 1 })
  @ApiStandardResponse(LoRelationDto)
  @ApiResponse({ status: 403, description: 'Solo profesores' })
  update(
    @Param('pageId', ParseIntPipe) pageId: number,
    @Param('relationId', ParseIntPipe) relationId: number,
    @Body() dto: UpdateLoRelationDto,
    @GetUser() user: User,
  ): Promise<LoRelationDto> {
    return this.pageRelationsService.update(pageId, relationId, dto, user)
  }

  @Delete(':pageId/relations/:relationId')
  @ApiOperation({ summary: 'Eliminar relación' })
  @ApiParam({ name: 'pageId', type: Number, example: 1 })
  @ApiParam({ name: 'relationId', type: Number, example: 1 })
  @ApiStandardResponse(undefined, HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 403, description: 'Solo profesores' })
  delete(
    @Param('pageId', ParseIntPipe) pageId: number,
    @Param('relationId', ParseIntPipe) relationId: number,
    @GetUser() user: User,
  ): Promise<void> {
    return this.pageRelationsService.delete(pageId, relationId, user)
  }
}
