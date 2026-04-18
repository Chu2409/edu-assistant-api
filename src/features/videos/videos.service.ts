import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { DBService } from 'src/core/database/database.service'
import { QUEUE_NAMES } from 'src/shared/constants/queues'
import {
  IngestionStatus,
  Prisma,
  Role,
  SourceKind,
  type User,
} from 'src/core/database/generated/client'
import { HttpStatus } from '@nestjs/common'
import { BusinessException } from 'src/shared/exceptions/business.exception'
import { CreateVideoFromUrlDto } from './dtos/req/create-video-from-url.dto'
import { UploadVideoFileDto } from './dtos/req/upload-video-file.dto'
import { RetryVideoContentDto } from './dtos/req/retry-video-content.dto'
import { VideoFiltersDto } from './dtos/req/video-filters.dto'
import { VideoDto } from './dtos/res/video.dto'
import { FullVideoDto } from './dtos/res/full-video.dto'
import { VideoStatusDto } from './dtos/res/video-status.dto'
import { VideoMapper } from './mappers/video.mapper'
import { ApiPaginatedRes } from 'src/shared/dtos/res/api-response.dto'
import { isYoutubeUrl } from './transcription/utils/youtube-url.util'
import {
  GENERATED_BLOCK_TYPES,
  VIDEO_LO_TYPE_NAME,
} from './constants/video.constants'

@Injectable()
export class VideosService {
  constructor(
    private readonly dbService: DBService,
    @InjectQueue(QUEUE_NAMES.VIDEOS.NAME)
    private readonly videosQueue: Queue,
  ) {}

  async createFromUrl(
    dto: CreateVideoFromUrlDto,
    user: User,
  ): Promise<VideoDto> {
    if (!isYoutubeUrl(dto.url)) {
      throw new BusinessException(
        'The provided URL is not a valid YouTube URL',
        HttpStatus.BAD_REQUEST,
      )
    }

    const module = await this.findModuleOrFail(dto.moduleId, user)

    const lastLo = await this.dbService.learningObject.findFirst({
      where: { moduleId: module.id },
      orderBy: { orderIndex: 'desc' },
    })

    const videoType = await this.findLoTypeOrFail(VIDEO_LO_TYPE_NAME)

    const lo = await this.dbService.learningObject.create({
      data: {
        moduleId: module.id,
        typeId: videoType.id,
        title: dto.title,
        isPublished: false,
        orderIndex: lastLo ? lastLo.orderIndex + 1 : 1,
        video: {
          create: {
            kind: SourceKind.YOUTUBE_URL,
            sourceUrl: dto.url,
            status: IngestionStatus.PENDING,
            outputLanguage: dto.outputLanguage,
          },
        },
      },
      include: { video: true },
    })

    await this.enqueueProcessing(lo.id)

    return VideoMapper.toDto(
      lo as typeof lo & { video: NonNullable<typeof lo.video> },
    )
  }

  async uploadFile(
    file: Express.Multer.File,
    dto: UploadVideoFileDto,
    user: User,
  ): Promise<VideoDto> {
    const module = await this.findModuleOrFail(dto.moduleId, user)

    const lastLo = await this.dbService.learningObject.findFirst({
      where: { moduleId: module.id },
      orderBy: { orderIndex: 'desc' },
    })

    const videoType = await this.findLoTypeOrFail(VIDEO_LO_TYPE_NAME)

    const lo = await this.dbService.learningObject.create({
      data: {
        moduleId: module.id,
        typeId: videoType.id,
        title: dto.title,
        isPublished: false,
        orderIndex: lastLo ? lastLo.orderIndex + 1 : 1,
        video: {
          create: {
            kind: SourceKind.VIDEO_FILE,
            sourceUrl: file.path,
            status: IngestionStatus.PENDING,
            outputLanguage: dto.outputLanguage,
            metadata: { fileName: file.originalname, mimeType: file.mimetype },
          },
        },
      },
      include: { video: true },
    })

    await this.enqueueProcessing(lo.id)

    return VideoMapper.toDto(
      lo as typeof lo & { video: NonNullable<typeof lo.video> },
    )
  }

  async findAll(
    moduleId: number,
    params: VideoFiltersDto,
    user: User,
  ): Promise<ApiPaginatedRes<VideoDto>> {
    const module = await this.dbService.module.findUnique({
      where: { id: moduleId },
      include: { enrollments: true },
    })

    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`)
    }

    if (
      module.teacherId !== user.id &&
      !module.isPublic &&
      !module.enrollments.some((e) => e.userId === user.id)
    ) {
      throw new ForbiddenException('No permission to access this module')
    }

    const where: Prisma.LearningObjectWhereInput = {
      moduleId,
      type: { name: 'VIDEO' },
      video: params.status ? { status: params.status } : { isNot: null },
    }

    if (params.search) {
      where.title = { contains: params.search, mode: 'insensitive' }
    }

    if (user.role === Role.STUDENT && module.teacherId !== user.id) {
      where.isPublished = true
    }

    const [entities, total] = await Promise.all([
      this.dbService.learningObject.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { orderIndex: 'asc' },
        include: { video: true },
      }),
      this.dbService.learningObject.count({ where }),
    ])

    const records = entities
      .filter((lo) => lo.video !== null)
      .map((lo) =>
        VideoMapper.toDto(
          lo as typeof lo & {
            video: NonNullable<typeof lo.video>
          },
        ),
      )

    return {
      records,
      total,
      limit: params.limit,
      page: params.page,
      pages: Math.ceil(total / params.limit),
    }
  }

  async findOne(id: number, user: User): Promise<FullVideoDto> {
    const lo = await this.dbService.learningObject.findFirst({
      where: { video: { learningObjectId: id } },
      include: {
        video: true,
        blocks: { orderBy: { orderIndex: 'asc' } },
        module: { include: { enrollments: true } },
      },
    })

    if (!lo?.video) {
      throw new NotFoundException(`Video with ID ${id} not found`)
    }

    this.checkReadPermission(lo.module, user, lo.isPublished)

    return VideoMapper.toFullDto(
      lo as typeof lo & { video: NonNullable<typeof lo.video> },
    )
  }

  async getStatus(id: number): Promise<VideoStatusDto> {
    const lo = await this.dbService.learningObject.findUnique({
      where: { id },
      include: { video: true },
    })

    if (!lo?.video) {
      throw new NotFoundException(`Video with ID ${id} not found`)
    }

    return VideoMapper.toStatusDto(
      lo as typeof lo & { video: NonNullable<typeof lo.video> },
    )
  }

  async retry(
    id: number,
    dto: RetryVideoContentDto,
    user: User,
  ): Promise<VideoStatusDto> {
    const lo = await this.dbService.learningObject.findFirst({
      where: { video: { learningObjectId: id } },
      include: { video: true, module: true },
    })

    if (!lo?.video) {
      throw new NotFoundException(`Video with ID ${id} not found`)
    }

    if (lo.module.teacherId !== user.id) {
      throw new ForbiddenException(
        'Only the module owner can retry content generation',
      )
    }

    if (
      lo.video.status !== IngestionStatus.FAILED &&
      lo.video.status !== IngestionStatus.COMPLETED
    ) {
      throw new BusinessException(
        'Can only retry videos that have completed or failed',
        HttpStatus.CONFLICT,
      )
    }

    const contentTypes = dto.contentTypes ?? [...GENERATED_BLOCK_TYPES]

    await this.dbService.video.update({
      where: { learningObjectId: id },
      data: { status: IngestionStatus.GENERATING, errorMessage: null },
    })

    await this.videosQueue.add(
      QUEUE_NAMES.VIDEOS.JOBS.RETRY,
      { learningObjectId: lo.id, contentTypes },
      { removeOnComplete: { count: 100 }, removeOnFail: { count: 50 } },
    )

    const updatedLo = await this.dbService.learningObject.findUniqueOrThrow({
      where: { id: lo.id },
      include: { video: true },
    })

    return VideoMapper.toStatusDto(
      updatedLo as typeof updatedLo & {
        video: NonNullable<typeof updatedLo.video>
      },
    )
  }

  async remove(id: number, user: User): Promise<void> {
    const lo = await this.dbService.learningObject.findFirst({
      where: { video: { learningObjectId: id } },
      include: { video: true, module: true },
    })

    if (!lo?.video) {
      throw new NotFoundException(`Video with ID ${id} not found`)
    }

    if (lo.module.teacherId !== user.id) {
      throw new ForbiddenException('Only the module owner can delete videos')
    }

    await this.dbService.learningObject.delete({ where: { id: lo.id } })
  }

  private async findModuleOrFail(moduleId: number, user: User) {
    const module = await this.dbService.module.findUnique({
      where: { id: moduleId },
    })

    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`)
    }

    if (module.teacherId !== user.id) {
      throw new ForbiddenException('Only the module owner can create videos')
    }

    return module
  }

  private async findLoTypeOrFail(name: string) {
    const loType = await this.dbService.learningObjectType.findUnique({
      where: { name },
    })

    if (!loType) {
      throw new BusinessException(
        `LearningObjectType "${name}" not found. Run seed first.`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    return loType
  }

  private checkReadPermission(
    module: {
      teacherId: number
      isPublic: boolean
      enrollments?: { userId: number }[]
    },
    user: User,
    isPublished: boolean,
  ): void {
    if (module.teacherId === user.id) return

    if (user.role === Role.STUDENT && !isPublished) {
      throw new ForbiddenException('This video is not published yet')
    }

    if (
      !module.isPublic &&
      !module.enrollments?.some((e) => e.userId === user.id)
    ) {
      throw new ForbiddenException('No permission to access this video')
    }
  }

  private async enqueueProcessing(learningObjectId: number): Promise<void> {
    await this.videosQueue.add(
      QUEUE_NAMES.VIDEOS.JOBS.PROCESS,
      { learningObjectId },
      {
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
      },
    )
  }
}
