import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname } from 'path'
import { mkdirSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { VIDEO_UPLOAD_DIR } from './constants/video.constants'

mkdirSync(VIDEO_UPLOAD_DIR, { recursive: true })
import { ApiTags, ApiOperation, ApiParam, ApiConsumes } from '@nestjs/swagger'
import { Role, type User } from 'src/core/database/generated/client'
import { JwtAuth } from 'src/features/auth/decorators/jwt-auth.decorator'
import { GetUser } from 'src/features/auth/decorators/get-user.decorator'
import {
  ApiPaginatedResponse,
  ApiStandardResponse,
} from 'src/shared/decorators/api-standard-response.decorator'
import { ApiPaginatedRes } from 'src/shared/dtos/res/api-response.dto'
import { VideosService } from './main/videos.service'
import { CreateVideoFromUrlDto } from './main/dtos/req/create-video-from-url.dto'
import { UploadVideoFileDto } from './main/dtos/req/upload-video-file.dto'
import { RetryVideoContentDto } from './main/dtos/req/retry-video-content.dto'
import { UpdateVideoContentDto } from './main/dtos/req/update-video-content.dto'
import { VideoFiltersDto } from './main/dtos/req/video-filters.dto'
import { VideoDto } from './main/dtos/res/video.dto'
import { FullVideoDto } from './main/dtos/res/full-video.dto'
import { VideoStatusDto } from './main/dtos/res/video-status.dto'
import {
  VIDEO_FILE_MAX_SIZE_BYTES,
  VIDEO_MIME_TYPES,
} from './constants/video.constants'
import { BusinessException } from 'src/shared/exceptions/business.exception'

@ApiTags('Videos')
@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post()
  @ApiOperation({ summary: 'Create a video from a YouTube URL' })
  @ApiStandardResponse(VideoDto, HttpStatus.CREATED)
  @JwtAuth(Role.TEACHER)
  create(
    @Body() dto: CreateVideoFromUrlDto,
    @GetUser() user: User,
  ): Promise<VideoDto> {
    return this.videosService.createFromUrl(dto, user)
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload a video file' })
  @ApiConsumes('multipart/form-data')
  @ApiStandardResponse(VideoDto, HttpStatus.CREATED)
  @JwtAuth(Role.TEACHER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: VIDEO_UPLOAD_DIR,
        filename: (_req, file, cb) =>
          cb(null, `${uuidv4()}${extname(file.originalname)}`),
      }),
      limits: { fileSize: VIDEO_FILE_MAX_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (VIDEO_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true)
        } else {
          cb(
            new BusinessException(
              `Unsupported file type: ${file.mimetype}`,
              HttpStatus.BAD_REQUEST,
            ),
            false,
          )
        }
      },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadVideoFileDto,
    @GetUser() user: User,
  ): Promise<VideoDto> {
    return this.videosService.uploadFile(file, dto, user)
  }

  @Get('module/:moduleId')
  @ApiOperation({ summary: 'List all videos in a module' })
  @ApiParam({ name: 'moduleId', example: 1 })
  @ApiPaginatedResponse(VideoDto)
  findAll(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Query() params: VideoFiltersDto,
    @GetUser() user: User,
  ): Promise<ApiPaginatedRes<VideoDto>> {
    return this.videosService.findAll(moduleId, params, user)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get video details with blocks' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiStandardResponse(FullVideoDto)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<FullVideoDto> {
    return this.videosService.findOne(id, user)
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get video processing status (polling)' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiStandardResponse(VideoStatusDto)
  getStatus(@Param('id', ParseIntPipe) id: number): Promise<VideoStatusDto> {
    return this.videosService.getStatus(id)
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry failed content generation' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiStandardResponse(VideoStatusDto)
  @JwtAuth(Role.TEACHER)
  retry(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RetryVideoContentDto,
    @GetUser() user: User,
  ): Promise<VideoStatusDto> {
    return this.videosService.retry(id, dto, user)
  }

  @Patch(':id/content')
  @ApiOperation({
    summary: 'Manually update video blocks (full replace)',
    description:
      'Teacher-driven form edit. Replaces all blocks for the video: sent blocks with id get updated, without id get created, any existing block not present is deleted. Marks the video as having manual edits.',
  })
  @ApiParam({ name: 'id', example: 1 })
  @ApiStandardResponse(FullVideoDto)
  @JwtAuth(Role.TEACHER)
  updateContent(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVideoContentDto,
    @GetUser() user: User,
  ): Promise<FullVideoDto> {
    return this.videosService.updateContent(id, dto, user)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a video' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiStandardResponse(undefined, HttpStatus.NO_CONTENT)
  @JwtAuth(Role.TEACHER)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<void> {
    return this.videosService.remove(id, user)
  }
}
