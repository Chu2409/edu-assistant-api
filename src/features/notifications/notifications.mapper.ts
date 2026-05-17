import { Notification } from 'src/core/database/generated/client'
import { NotificationDto } from './dtos/res/notification.dto'

export class NotificationsMapper {
  static toDto(record: Notification): NotificationDto {
    return {
      id: record.id,
      type: record.type,
      title: record.title,
      message: record.message,
      relatedEntityId: record.relatedEntityId ?? undefined,
      relatedEntityType: record.relatedEntityType ?? undefined,
      isRead: record.isRead,
      createdAt: record.createdAt,
    }
  }

  static toDtoList(records: Notification[]): NotificationDto[] {
    return records.map((r) => NotificationsMapper.toDto(r))
  }
}
