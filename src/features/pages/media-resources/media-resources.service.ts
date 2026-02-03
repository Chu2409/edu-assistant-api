import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import {
  Enrollment,
  Prisma,
  Role,
  type User,
} from 'src/core/database/generated/client'
import { CreateMediaResourceDto } from './dtos/req/create-media-resource.dto'
import { UpdateMediaResourceDto } from './dtos/req/update-media-resource.dto'
import { MediaResourceDto } from './dtos/res/media-resource.dto'
import { PagesHelperService } from '../main/pages-helper.service'

@Injectable()
export class MediaResourcesService {
  constructor(
    private readonly dbService: DBService,
    private readonly pagesHelperService: PagesHelperService,
  ) {}

  private toDto(entity: any): MediaResourceDto {
    return {
      id: entity.id,
      pageId: entity.pageId ?? null,
      type: entity.type,
      title: entity.title ?? null,
      url: entity.url,
      thumbnailUrl: entity.thumbnailUrl ?? null,
      fileSize: entity.fileSize ?? null,
      mimeType: entity.mimeType ?? null,
      createdAt: entity.createdAt,
    }
  }

  async list(pageId: number, user: User): Promise<MediaResourceDto[]> {
    await this.pagesHelperService.getPageForRead(pageId, user)
    const resources = await this.dbService.mediaResource.findMany({
      where: { pageId },
      orderBy: { createdAt: 'desc' },
    })
    return resources.map((r) => this.toDto(r))
  }

  async create(
    pageId: number,
    dto: CreateMediaResourceDto,
    user: User,
  ): Promise<MediaResourceDto> {
    await this.pagesHelperService.getPageForWrite(pageId, user)

    const created = await this.dbService.mediaResource.create({
      data: {
        pageId,
        type: dto.type,
        title: dto.title ?? null,
        url: dto.url,
        thumbnailUrl: dto.thumbnailUrl ?? null,
        fileSize: dto.fileSize ?? null,
        mimeType: dto.mimeType ?? null,
      },
    })

    return this.toDto(created)
  }

  async update(
    pageId: number,
    resourceId: number,
    dto: UpdateMediaResourceDto,
    user: User,
  ): Promise<MediaResourceDto> {
    await this.pagesHelperService.getPageForWrite(pageId, user)

    const existing = await this.dbService.mediaResource.findUnique({
      where: { id: resourceId },
    })
    if (!existing || existing.pageId !== pageId) {
      throw new NotFoundException('Recurso no encontrado')
    }

    const updated = await this.dbService.mediaResource.update({
      where: { id: resourceId },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.url !== undefined && { url: dto.url }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.thumbnailUrl !== undefined && {
          thumbnailUrl: dto.thumbnailUrl,
        }),
        ...(dto.fileSize !== undefined && { fileSize: dto.fileSize }),
        ...(dto.mimeType !== undefined && { mimeType: dto.mimeType }),
      },
    })

    return this.toDto(updated)
  }

  async delete(pageId: number, resourceId: number, user: User): Promise<void> {
    await this.pagesHelperService.getPageForWrite(pageId, user)

    const existing = await this.dbService.mediaResource.findUnique({
      where: { id: resourceId },
    })
    if (!existing || existing.pageId !== pageId) {
      throw new NotFoundException('Recurso no encontrado')
    }

    await this.dbService.mediaResource.delete({ where: { id: resourceId } })
  }
}
