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
import { ActivitiesService } from './activities.service'
import { ActivityDto } from './dtos/res/activity.dto'
import { CreateActivityDto } from './dtos/req/create-activity.dto'
import { UpdateActivityDto } from './dtos/req/update-activity.dto'

@ApiTags('Activities')
@Controller('pages')
@JwtAuth()
export class PagesActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get(':pageId/activities')
  @ApiOperation({ summary: 'Listar actividades de una página' })
  @ApiParam({ name: 'pageId', type: Number, example: 1 })
  @ApiStandardResponse([ActivityDto])
  list(
    @Param('pageId', ParseIntPipe) pageId: number,
    @GetUser() user: User,
  ): Promise<ActivityDto[]> {
    return this.activitiesService.list(pageId, user)
  }

  @Post(':pageId/activities')
  @ApiOperation({ summary: 'Crear actividad' })
  @ApiParam({ name: 'pageId', type: Number, example: 1 })
  @ApiStandardResponse(ActivityDto, HttpStatus.CREATED)
  @ApiResponse({ status: 403, description: 'Solo profesores' })
  @JwtAuth(Role.TEACHER)
  create(
    @Param('pageId', ParseIntPipe) pageId: number,
    @Body() dto: CreateActivityDto,
    @GetUser() user: User,
  ): Promise<ActivityDto> {
    return this.activitiesService.create(pageId, dto, user)
  }

  @Patch(':pageId/activities/:activityId')
  @ApiOperation({ summary: 'Actualizar actividad' })
  @ApiParam({ name: 'pageId', type: Number, example: 1 })
  @ApiParam({ name: 'activityId', type: Number, example: 1 })
  @ApiStandardResponse(ActivityDto)
  @ApiResponse({ status: 403, description: 'Solo profesores' })
  @JwtAuth(Role.TEACHER)
  update(
    @Param('pageId', ParseIntPipe) pageId: number,
    @Param('activityId', ParseIntPipe) activityId: number,
    @Body() dto: UpdateActivityDto,
    @GetUser() user: User,
  ): Promise<ActivityDto> {
    return this.activitiesService.update(pageId, activityId, dto, user)
  }

  @Delete(':pageId/activities/:activityId')
  @ApiOperation({ summary: 'Eliminar actividad' })
  @ApiParam({ name: 'pageId', type: Number, example: 1 })
  @ApiParam({ name: 'activityId', type: Number, example: 1 })
  @ApiStandardResponse(undefined, HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 403, description: 'Solo profesores' })
  @JwtAuth(Role.TEACHER)
  delete(
    @Param('pageId', ParseIntPipe) pageId: number,
    @Param('activityId', ParseIntPipe) activityId: number,
    @GetUser() user: User,
  ): Promise<void> {
    return this.activitiesService.delete(pageId, activityId, user)
  }
}
