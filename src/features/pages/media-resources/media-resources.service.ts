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

@Injectable()
export class MediaResourcesService {
  constructor(private readonly dbService: DBService) {}

  private async getPageForRead(pageId: number, user: User) {
    const page = await this.dbService.page.findUnique({
      where: { id: pageId },
      include: { module: { include: { enrollments: true } } },
    })
    if (!page)
      throw new NotFoundException(`Página con ID ${pageId} no encontrada`)

    if (user.role === Role.ADMIN) return page

    if (user.role === Role.TEACHER) {
      if (page.module.teacherId !== user.id) {
        throw new ForbiddenException(
          'No tienes permisos para acceder a esta página',
        )
      }
      return page
    }

    const hasAccess =
      page.module.isPublic ||
      page.module.enrollments.some(
        (enrollment: Enrollment) =>
          enrollment.userId === user.id && enrollment.isActive,
      )
    if (!hasAccess) {
      throw new ForbiddenException(
        'No tienes permisos para acceder a esta página',
      )
    }
    if (!page.isPublished) {
      throw new ForbiddenException('Esta página no está publicada aún')
    }
    return page
  }

  private async getPageForWrite(pageId: number, user: User) {
    const page = await this.dbService.page.findUnique({
      where: { id: pageId },
      include: { module: true },
    })
    if (!page)
      throw new NotFoundException(`Página con ID ${pageId} no encontrada`)

    if (user.role === Role.ADMIN) return page
    if (page.module.teacherId !== user.id) {
      throw new ForbiddenException(
        'Solo el profesor propietario puede modificar recursos de esta página',
      )
    }
    return page
  }

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
    await this.getPageForRead(pageId, user)
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
    await this.getPageForWrite(pageId, user)

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
    await this.getPageForWrite(pageId, user)

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
    await this.getPageForWrite(pageId, user)

    const existing = await this.dbService.mediaResource.findUnique({
      where: { id: resourceId },
    })
    if (!existing || existing.pageId !== pageId) {
      throw new NotFoundException('Recurso no encontrado')
    }

    await this.dbService.mediaResource.delete({ where: { id: resourceId } })
  }
}
