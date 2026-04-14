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
  BlockType,
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
import { TranscriptionResult } from './transcription/interfaces/transcription-result.interface'
import { GenerationResult } from './ai/interfaces/generation.interface'

const GENERATED_BLOCK_TYPES = [
  BlockType.SUMMARY,
  BlockType.FLASHCARDS,
  BlockType.QUIZ,
  BlockType.GLOSSARY,
]

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

    const videoType = await this.findLoTypeOrFail('VIDEO')

    const lo = await this.dbService.learningObject.create({
      data: {
        moduleId: module.id,
        typeId: videoType.id,
        title: dto.title,
        isPublished: false,
        orderIndex: lastLo ? lastLo.orderIndex + 1 : 1,
        contentSource: {
          create: {
            kind: SourceKind.YOUTUBE_URL,
            sourceUrl: dto.url,
            status: IngestionStatus.PENDING,
            outputLanguage: dto.outputLanguage,
          },
        },
      },
      include: { contentSource: true },
    })

    await this.enqueueProcessing(lo.id)

    return VideoMapper.toDto(
      lo as typeof lo & { contentSource: NonNullable<typeof lo.contentSource> },
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

    const videoType = await this.findLoTypeOrFail('VIDEO')

    const lo = await this.dbService.learningObject.create({
      data: {
        moduleId: module.id,
        typeId: videoType.id,
        title: dto.title,
        isPublished: false,
        orderIndex: lastLo ? lastLo.orderIndex + 1 : 1,
        contentSource: {
          create: {
            kind: SourceKind.VIDEO_FILE,
            sourceUrl: file.path,
            status: IngestionStatus.PENDING,
            outputLanguage: dto.outputLanguage,
            metadata: { fileName: file.originalname, mimeType: file.mimetype },
          },
        },
      },
      include: { contentSource: true },
    })

    await this.enqueueProcessing(lo.id)

    return VideoMapper.toDto(
      lo as typeof lo & { contentSource: NonNullable<typeof lo.contentSource> },
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
      contentSource: params.status
        ? { status: params.status }
        : { isNot: null },
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
        include: { contentSource: true },
      }),
      this.dbService.learningObject.count({ where }),
    ])

    const records = entities
      .filter((lo) => lo.contentSource !== null)
      .map((lo) =>
        VideoMapper.toDto(
          lo as typeof lo & {
            contentSource: NonNullable<typeof lo.contentSource>
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
      where: { contentSource: { id } },
      include: {
        contentSource: true,
        blocks: { orderBy: { orderIndex: 'asc' } },
        module: { include: { enrollments: true } },
      },
    })

    if (!lo?.contentSource) {
      throw new NotFoundException(`Video with ID ${id} not found`)
    }

    this.checkReadPermission(lo.module, user, lo.isPublished)

    return VideoMapper.toFullDto(
      lo as typeof lo & { contentSource: NonNullable<typeof lo.contentSource> },
    )
  }

  async getStatus(id: number): Promise<VideoStatusDto> {
    const cs = await this.dbService.contentSource.findUnique({ where: { id } })

    if (!cs) {
      throw new NotFoundException(`Video with ID ${id} not found`)
    }

    return VideoMapper.toStatusDto(cs)
  }

  async retry(
    id: number,
    dto: RetryVideoContentDto,
    user: User,
  ): Promise<VideoStatusDto> {
    const lo = await this.dbService.learningObject.findFirst({
      where: { contentSource: { id } },
      include: { contentSource: true, module: true },
    })

    if (!lo?.contentSource) {
      throw new NotFoundException(`Video with ID ${id} not found`)
    }

    if (lo.module.teacherId !== user.id) {
      throw new ForbiddenException(
        'Only the module owner can retry content generation',
      )
    }

    if (
      lo.contentSource.status !== IngestionStatus.FAILED &&
      lo.contentSource.status !== IngestionStatus.COMPLETED
    ) {
      throw new BusinessException(
        'Can only retry videos that have completed or failed',
        HttpStatus.CONFLICT,
      )
    }

    const contentTypes = dto.contentTypes ?? GENERATED_BLOCK_TYPES

    await this.dbService.contentSource.update({
      where: { id },
      data: { status: IngestionStatus.GENERATING, errorMessage: null },
    })

    await this.videosQueue.add(
      QUEUE_NAMES.VIDEOS.JOBS.RETRY,
      { learningObjectId: lo.id, contentTypes },
      { removeOnComplete: { count: 100 }, removeOnFail: { count: 50 } },
    )

    return VideoMapper.toStatusDto(
      await this.dbService.contentSource.findUniqueOrThrow({ where: { id } }),
    )
  }

  async remove(id: number, user: User): Promise<void> {
    const lo = await this.dbService.learningObject.findFirst({
      where: { contentSource: { id } },
      include: { contentSource: true, module: true },
    })

    if (!lo?.contentSource) {
      throw new NotFoundException(`Video with ID ${id} not found`)
    }

    if (lo.module.teacherId !== user.id) {
      throw new ForbiddenException('Only the module owner can delete videos')
    }

    await this.dbService.learningObject.delete({ where: { id: lo.id } })
  }

  async updateStatus(
    learningObjectId: number,
    status: IngestionStatus,
    extra?: { errorMessage?: string },
  ): Promise<void> {
    await this.dbService.contentSource.update({
      where: { learningObjectId },
      data: { status, errorMessage: extra?.errorMessage },
    })
  }

  async persistTranscription(
    learningObjectId: number,
    result: TranscriptionResult,
  ): Promise<void> {
    await this.dbService.contentSource.update({
      where: { learningObjectId },
      data: {
        rawText: result.text,
        detectedLanguage: result.language,
        durationSeconds: result.durationSeconds,
      },
    })
  }

  async persistGeneratedContent(
    learningObjectId: number,
    generated: GenerationResult,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.block.deleteMany({
      where: {
        learningObjectId,
        type: { in: GENERATED_BLOCK_TYPES },
      },
    })

    let orderIndex = 0
    const blocks: Prisma.BlockCreateManyInput[] = []

    if (generated.summary) {
      blocks.push({
        learningObjectId,
        type: BlockType.SUMMARY,
        content: generated.summary as unknown as Prisma.InputJsonValue,
        orderIndex: orderIndex++,
      })
    }
    if (generated.flashcards) {
      blocks.push({
        learningObjectId,
        type: BlockType.FLASHCARDS,
        content: generated.flashcards as unknown as Prisma.InputJsonValue,
        orderIndex: orderIndex++,
      })
    }
    if (generated.quiz) {
      blocks.push({
        learningObjectId,
        type: BlockType.QUIZ,
        content: generated.quiz as unknown as Prisma.InputJsonValue,
        orderIndex: orderIndex++,
      })
    }
    if (generated.glossary) {
      blocks.push({
        learningObjectId,
        type: BlockType.GLOSSARY,
        content: generated.glossary as unknown as Prisma.InputJsonValue,
        orderIndex: orderIndex++,
      })
    }

    if (blocks.length > 0) {
      await tx.block.createMany({ data: blocks })
    }
  }

  async loadForProcessing(learningObjectId: number) {
    const lo = await this.dbService.learningObject.findUnique({
      where: { id: learningObjectId },
      include: { contentSource: true },
    })

    if (!lo?.contentSource) {
      throw new NotFoundException(
        `LearningObject ${learningObjectId} has no content source`,
      )
    }

    return {
      title: lo.title,
      kind: lo.contentSource.kind,
      sourceUrl: lo.contentSource.sourceUrl,
      outputLanguage: lo.contentSource.outputLanguage,
      rawText: lo.contentSource.rawText,
    }
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
