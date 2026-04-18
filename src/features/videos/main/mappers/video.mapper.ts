import {
  Block,
  Video,
  LearningObject,
} from 'src/core/database/generated/client'
import { VideoDto } from '../dtos/res/video.dto'
import { FullVideoDto } from '../dtos/res/full-video.dto'
import { VideoStatusDto } from '../dtos/res/video-status.dto'
import { BlocksMapper } from 'src/features/learning-objects/blocks/mappers/blocks.mapper'

type LoWithVideo = LearningObject & { video: Video }
type LoWithVideoAndBlocks = LoWithVideo & { blocks: Block[] }

export class VideoMapper {
  static toDto(lo: LoWithVideo): VideoDto {
    const v = lo.video
    return {
      id: lo.id,
      learningObjectId: lo.id,
      moduleId: lo.moduleId,
      title: lo.title,
      sourceKind: v.kind,
      sourceUrl: v.sourceUrl,
      status: v.status,
      outputLanguage: v.outputLanguage,
      durationSeconds: v.durationSeconds,
      isPublished: lo.isPublished,
      errorMessage: v.errorMessage,
      createdAt: lo.createdAt,
    }
  }

  static toFullDto(lo: LoWithVideoAndBlocks): FullVideoDto {
    const v = lo.video
    return {
      id: lo.id,
      learningObjectId: lo.id,
      moduleId: lo.moduleId,
      title: lo.title,
      sourceKind: v.kind,
      sourceUrl: v.sourceUrl,
      status: v.status,
      outputLanguage: v.outputLanguage,
      durationSeconds: v.durationSeconds,
      detectedLanguage: v.detectedLanguage,
      transcription: v.rawText,
      isPublished: lo.isPublished,
      errorMessage: v.errorMessage,
      metadata: v.metadata as Record<string, unknown> | null,
      blocks: lo.blocks.map((block) => BlocksMapper.mapToDto(block)),
      createdAt: lo.createdAt,
    }
  }

  static toStatusDto(
    lo: Pick<LearningObject, 'id' | 'createdAt'> & { video: Video },
  ): VideoStatusDto {
    const v = lo.video
    return {
      id: lo.id,
      status: v.status,
      errorMessage: v.errorMessage,
      startedAt: lo.createdAt,
      completedAt: v.updatedAt,
    }
  }
}
