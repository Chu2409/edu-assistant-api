import {
  Body,
  Controller,
  Delete,
  Get,
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
import { MediaResourcesService } from './media-resources.service'
import { MediaResourceDto } from './dtos/res/media-resource.dto'
import { CreateMediaResourceDto } from './dtos/req/create-media-resource.dto'
import { UpdateMediaResourceDto } from './dtos/req/update-media-resource.dto'

@ApiTags('Media Resources')
@Controller('pages')
@JwtAuth()
export class MediaResourcesController {
  constructor(private readonly mediaResourcesService: MediaResourcesService) {}

  @Get(':pageId/media-resources')
  @ApiOperation({ summary: 'Listar recursos multimedia de una página' })
  @ApiParam({ name: 'pageId', type: Number, example: 1 })
  @ApiStandardResponse([MediaResourceDto])
  list(
    @Param('pageId', ParseIntPipe) pageId: number,
    @GetUser() user: User,
  ): Promise<MediaResourceDto[]> {
    return this.mediaResourcesService.list(pageId, user)
  }

  @Post(':pageId/media-resources')
  @ApiOperation({ summary: 'Crear recurso multimedia' })
  @ApiParam({ name: 'pageId', type: Number, example: 1 })
  @ApiStandardResponse(MediaResourceDto, HttpStatus.CREATED)
  @ApiResponse({ status: 403, description: 'Solo profesores' })
  @JwtAuth(Role.TEACHER)
  create(
    @Param('pageId', ParseIntPipe) pageId: number,
    @Body() dto: CreateMediaResourceDto,
    @GetUser() user: User,
  ): Promise<MediaResourceDto> {
    return this.mediaResourcesService.create(pageId, dto, user)
  }

  @Patch(':pageId/media-resources/:resourceId')
  @ApiOperation({ summary: 'Actualizar recurso multimedia' })
  @ApiParam({ name: 'pageId', type: Number, example: 1 })
  @ApiParam({ name: 'resourceId', type: Number, example: 1 })
  @ApiStandardResponse(MediaResourceDto)
  @ApiResponse({ status: 403, description: 'Solo profesores' })
  @JwtAuth(Role.TEACHER)
  update(
    @Param('pageId', ParseIntPipe) pageId: number,
    @Param('resourceId', ParseIntPipe) resourceId: number,
    @Body() dto: UpdateMediaResourceDto,
    @GetUser() user: User,
  ): Promise<MediaResourceDto> {
    return this.mediaResourcesService.update(pageId, resourceId, dto, user)
  }

  @Delete(':pageId/media-resources/:resourceId')
  @ApiOperation({ summary: 'Eliminar recurso multimedia' })
  @ApiParam({ name: 'pageId', type: Number, example: 1 })
  @ApiParam({ name: 'resourceId', type: Number, example: 1 })
  @ApiStandardResponse(undefined, HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 403, description: 'Solo profesores' })
  @JwtAuth(Role.TEACHER)
  delete(
    @Param('pageId', ParseIntPipe) pageId: number,
    @Param('resourceId', ParseIntPipe) resourceId: number,
    @GetUser() user: User,
  ): Promise<void> {
    return this.mediaResourcesService.delete(pageId, resourceId, user)
  }
}
