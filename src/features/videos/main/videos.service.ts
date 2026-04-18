import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
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
import { BusinessException } from 'src/shared/exceptions/business.exception'
import { ApiPaginatedRes } from 'src/shared/dtos/res/api-response.dto'
import { LoHelperService } from 'src/features/learning-objects/main/lo-helper.service'
import { CreateVideoFromUrlDto } from './dtos/req/create-video-from-url.dto'
import { UploadVideoFileDto } from './dtos/req/upload-video-file.dto'
import { RetryVideoContentDto } from './dtos/req/retry-video-content.dto'
import { VideoFiltersDto } from './dtos/req/video-filters.dto'
import { VideoDto } from './dtos/res/video.dto'
import { FullVideoDto } from './dtos/res/full-video.dto'
import { VideoStatusDto } from './dtos/res/video-status.dto'
import { VideoMapper } from './mappers/video.mapper'
import {
  GENERATED_BLOCK_TYPES,
  VIDEO_LO_TYPE_NAME,
} from '../constants/video.constants'

type VideoSource = {
  kind: SourceKind
  sourceUrl: string
  outputLanguage: string
  metadata?: Prisma.InputJsonValue
}

@Injectable()
export class VideosService {
  constructor(
    private readonly dbService: DBService,
    private readonly loHelper: LoHelperService,
    @InjectQueue(QUEUE_NAMES.VIDEOS.NAME)
    private readonly videosQueue: Queue,
  ) {}

  async createFromUrl(
    dto: CreateVideoFromUrlDto,
    user: User,
  ): Promise<VideoDto> {
    return this.createVideoLo(dto.moduleId, dto.title, user, {
      kind: SourceKind.YOUTUBE_URL,
      sourceUrl: dto.url,
      outputLanguage: dto.outputLanguage,
    })
  }

  async uploadFile(
    file: Express.Multer.File,
    dto: UploadVideoFileDto,
    user: User,
  ): Promise<VideoDto> {
    return this.createVideoLo(dto.moduleId, dto.title, user, {
      kind: SourceKind.VIDEO_FILE,
      sourceUrl: file.path,
      outputLanguage: dto.outputLanguage,
      metadata: {
        fileName: file.originalname,
        mimeType: file.mimetype,
      } satisfies Prisma.InputJsonValue,
    })
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
      type: { name: VIDEO_LO_TYPE_NAME },
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
          lo as typeof lo & { video: NonNullable<typeof lo.video> },
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
    await this.loHelper.getLoForRead(id, user)

    const lo = await this.dbService.learningObject.findUniqueOrThrow({
      where: { id },
      include: {
        video: true,
        blocks: { orderBy: { orderIndex: 'asc' } },
      },
    })

    if (!lo.video) {
      throw new NotFoundException(`Video with ID ${id} not found`)
    }

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
    await this.loHelper.getLoForWrite(id, user)

    const lo = await this.dbService.learningObject.findUniqueOrThrow({
      where: { id },
      include: { video: true },
    })

    if (!lo.video) {
      throw new NotFoundException(`Video with ID ${id} not found`)
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
      { videoId: id, contentTypes, instruction: dto.instruction },
      { removeOnComplete: { count: 100 }, removeOnFail: { count: 50 } },
    )

    const updated = await this.dbService.learningObject.findUniqueOrThrow({
      where: { id },
      include: { video: true },
    })

    return VideoMapper.toStatusDto(
      updated as typeof updated & { video: NonNullable<typeof updated.video> },
    )
  }

  async remove(id: number, user: User): Promise<void> {
    await this.loHelper.getLoForWrite(id, user)
    await this.dbService.learningObject.delete({ where: { id } })
  }

  private async createVideoLo(
    moduleId: number,
    title: string,
    user: User,
    source: VideoSource,
  ): Promise<VideoDto> {
    const module = await this.dbService.module.findUnique({
      where: { id: moduleId },
    })

    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`)
    }

    if (module.teacherId !== user.id) {
      throw new ForbiddenException('Only the module owner can create videos')
    }

    const videoType = await this.findLoTypeOrFail(VIDEO_LO_TYPE_NAME)
    const orderIndex = await this.loHelper.getNextOrderIndex(moduleId)

    const lo = await this.dbService.learningObject.create({
      data: {
        moduleId,
        typeId: videoType.id,
        title,
        isPublished: false,
        orderIndex,
        video: {
          create: {
            kind: source.kind,
            sourceUrl: source.sourceUrl,
            status: IngestionStatus.PENDING,
            outputLanguage: source.outputLanguage,
            metadata: source.metadata,
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

  private async enqueueProcessing(videoId: number): Promise<void> {
    await this.videosQueue.add(
      QUEUE_NAMES.VIDEOS.JOBS.PROCESS,
      { videoId },
      {
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
      },
    )
  }
}
