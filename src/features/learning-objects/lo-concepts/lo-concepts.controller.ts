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

@ApiTags('Page Concepts')
@Controller('pages')
@JwtAuth(Role.TEACHER)
export class LoConceptsController {
  constructor(private readonly pageConceptsService: LoConceptsService) {}

  @Post(':pageId/concepts')
  @ApiOperation({ summary: 'Crear concepto manualmente' })
  @ApiParam({ name: 'pageId', type: Number, example: 1 })
  @ApiStandardResponse(LoConceptDto, HttpStatus.CREATED)
  create(
    @Param('pageId', ParseIntPipe) pageId: number,
    @Body() dto: CreateLoConceptDto,
    @GetUser() user: User,
  ): Promise<LoConceptDto> {
    return this.pageConceptsService.create(pageId, dto, user)
  }

  @Patch(':pageId/concepts/:conceptId')
  @ApiOperation({ summary: 'Actualizar concepto' })
  @ApiParam({ name: 'pageId', type: Number, example: 1 })
  @ApiParam({ name: 'conceptId', type: Number, example: 1 })
  @ApiStandardResponse(LoConceptDto)
  update(
    @Param('pageId', ParseIntPipe) pageId: number,
    @Param('conceptId', ParseIntPipe) conceptId: number,
    @Body() dto: UpdateLoConceptDto,
    @GetUser() user: User,
  ): Promise<LoConceptDto> {
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
