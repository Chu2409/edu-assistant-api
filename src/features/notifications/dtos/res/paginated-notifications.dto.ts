import { ApiProperty } from '@nestjs/swagger'
import { ApiPaginatedRes } from 'src/shared/dtos/res/api-response.dto'
import { NotificationDto } from './notification.dto'

export class PaginatedNotificationsDto extends ApiPaginatedRes<NotificationDto> {
  @ApiProperty({ type: [NotificationDto] })
  declare records: NotificationDto[]
}
