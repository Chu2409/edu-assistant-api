import {
  Body,
  Controller,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common'
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuth } from 'src/features/auth/decorators/jwt-auth.decorator'
import { GetUser } from 'src/features/auth/decorators/get-user.decorator'
import { Role, type User } from 'src/core/database/generated/client'
import { ApiStandardResponse } from 'src/shared/decorators/api-standard-response.decorator'
import { ActivitiesService } from './activities.service'
import { CreateActivityAttemptDto } from './dtos/req/create-activity-attempt.dto'
import { ActivityAttemptDto } from './dtos/res/activity-attempt.dto'

@ApiTags('Activities')
@Controller('activities')
@JwtAuth(Role.STUDENT)
export class ActivityAttemptsController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post(':activityId/attempts')
  @ApiOperation({ summary: 'Registrar intento de actividad (estudiante)' })
  @ApiParam({ name: 'activityId', type: Number, example: 1 })
  @ApiStandardResponse(ActivityAttemptDto, HttpStatus.CREATED)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  createAttempt(
    @Param('activityId', ParseIntPipe) activityId: number,
    @Body() dto: CreateActivityAttemptDto,
    @GetUser() user: User,
  ): Promise<ActivityAttemptDto> {
    return this.activitiesService.createAttempt(activityId, dto, user)
  }
}
