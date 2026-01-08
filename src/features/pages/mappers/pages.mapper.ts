import { Page } from 'src/core/database/generated/client'
import { PageDto } from '../dtos/res/page.dto'

export class PagesMapper {
  static mapToDto(page: Page): PageDto {
    return {
      id: page.id,
      title: page.title,
      content: page.content,
      rawContent: page.rawContent,
      orderIndex: page.orderIndex,
      keywords: page.keywords,
      isPublished: page.isPublished,
      lastProcessedAt: page.lastProcessedAt,
      processingVersion: page.processingVersion,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    }
  }
}
