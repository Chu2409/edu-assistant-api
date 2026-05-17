import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { NotificationsService } from './notifications.service'
import { GetUser } from 'src/features/auth/decorators/get-user.decorator'
import { BaseParamsReqDto } from 'src/shared/dtos/req/base-params.dto'
import { PaginatedNotificationsDto } from './dtos/res/paginated-notifications.dto'
import { ApiStandardResponse } from 'src/shared/decorators/api-standard-response.decorator'

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar notificaciones del usuario autenticado' })
  @ApiStandardResponse(PaginatedNotificationsDto)
  async list(
    @GetUser('id') userId: number,
    @Query() params: BaseParamsReqDto,
  ): Promise<PaginatedNotificationsDto> {
    return this.notificationsService.listByUser(userId, params)
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar una notificación como leída' })
  @ApiResponse({ status: 200, description: 'Notificación actualizada' })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
  async read(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.notificationsService.markAsRead(userId, id)
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
  @ApiResponse({
    status: 200,
    description: 'Todas las notificaciones actualizadas',
  })
  async readAll(@GetUser('id') userId: number): Promise<void> {
    return this.notificationsService.markAllAsRead(userId)
  }
}
