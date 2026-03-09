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
import { PageConceptsService } from './page-concepts.service'
import { PageConceptDto } from './dtos/res/page-concept.dto'
import { CreatePageConceptDto } from './dtos/req/create-page-concept.dto'
import { UpdatePageConceptDto } from './dtos/req/update-page-concept.dto'

@ApiTags('Page Concepts')
@Controller('pages')
@JwtAuth(Role.TEACHER)
export class PageConceptsController {
  constructor(private readonly pageConceptsService: PageConceptsService) {}

  @Post(':pageId/concepts')
  @ApiOperation({ summary: 'Crear concepto manualmente' })
  @ApiParam({ name: 'pageId', type: Number, example: 1 })
  @ApiStandardResponse(PageConceptDto, HttpStatus.CREATED)
  create(
    @Param('pageId', ParseIntPipe) pageId: number,
    @Body() dto: CreatePageConceptDto,
    @GetUser() user: User,
  ): Promise<PageConceptDto> {
    return this.pageConceptsService.create(pageId, dto, user)
  }

  @Patch(':pageId/concepts/:conceptId')
  @ApiOperation({ summary: 'Actualizar concepto' })
  @ApiParam({ name: 'pageId', type: Number, example: 1 })
  @ApiParam({ name: 'conceptId', type: Number, example: 1 })
  @ApiStandardResponse(PageConceptDto)
  update(
    @Param('pageId', ParseIntPipe) pageId: number,
    @Param('conceptId', ParseIntPipe) conceptId: number,
    @Body() dto: UpdatePageConceptDto,
    @GetUser() user: User,
  ): Promise<PageConceptDto> {
    return this.pageConceptsService.update(pageId, conceptId, dto, user)
  }

  @Delete(':pageId/concepts/:conceptId')
  @ApiOperation({ summary: 'Eliminar concepto' })
  @ApiParam({ name: 'pageId', type: Number, example: 1 })
  @ApiParam({ name: 'conceptId', type: Number, example: 1 })
  @ApiStandardResponse(undefined, HttpStatus.NO_CONTENT)
  async delete(
    @Param('pageId', ParseIntPipe) pageId: number,
    @Param('conceptId', ParseIntPipe) conceptId: number,
    @GetUser() user: User,
  ): Promise<void> {
    return this.pageConceptsService.delete(pageId, conceptId, user)
  }
}
