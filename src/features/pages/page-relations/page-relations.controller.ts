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
import { PageRelationsService } from './page-relations.service'
import { PageRelationDto } from './dtos/res/page-relation.dto'
import { CreatePageRelationDto } from './dtos/req/create-page-relation.dto'
import { UpdatePageRelationDto } from './dtos/req/update-page-relation.dto'

@ApiTags('Page Relations')
@Controller('pages')
@JwtAuth()
export class PageRelationsController {
  constructor(private readonly pageRelationsService: PageRelationsService) {}

  @Post(':pageId/relations')
  @ApiOperation({ summary: 'Crear relación manualmente' })
  @ApiParam({ name: 'pageId', type: Number, example: 1 })
  @ApiStandardResponse(PageRelationDto, HttpStatus.CREATED)
  @ApiResponse({ status: 403, description: 'Solo profesores' })
  @JwtAuth(Role.TEACHER)
  create(
    @Param('pageId', ParseIntPipe) pageId: number,
    @Body() dto: CreatePageRelationDto,
    @GetUser() user: User,
  ): Promise<PageRelationDto> {
    return this.pageRelationsService.create(pageId, dto, user)
  }

  @Patch(':pageId/relations/:relationId')
  @ApiOperation({ summary: 'Actualizar relación' })
  @ApiParam({ name: 'pageId', type: Number, example: 1 })
  @ApiParam({ name: 'relationId', type: Number, example: 1 })
  @ApiStandardResponse(PageRelationDto)
  @ApiResponse({ status: 403, description: 'Solo profesores' })
  @JwtAuth(Role.TEACHER)
  update(
    @Param('pageId', ParseIntPipe) pageId: number,
    @Param('relationId', ParseIntPipe) relationId: number,
    @Body() dto: UpdatePageRelationDto,
    @GetUser() user: User,
  ): Promise<PageRelationDto> {
    return this.pageRelationsService.update(pageId, relationId, dto, user)
  }

  @Delete(':pageId/relations/:relationId')
  @ApiOperation({ summary: 'Eliminar relación' })
  @ApiParam({ name: 'pageId', type: Number, example: 1 })
  @ApiParam({ name: 'relationId', type: Number, example: 1 })
  @ApiStandardResponse(undefined, HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 403, description: 'Solo profesores' })
  @JwtAuth(Role.TEACHER)
  delete(
    @Param('pageId', ParseIntPipe) pageId: number,
    @Param('relationId', ParseIntPipe) relationId: number,
    @GetUser() user: User,
  ): Promise<void> {
    return this.pageRelationsService.delete(pageId, relationId, user)
  }
}
