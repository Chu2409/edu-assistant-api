import {
  Block,
  ContentSource,
  LearningObject,
} from 'src/core/database/generated/client'
import { VideoDto } from '../dtos/res/video.dto'
import { FullVideoDto } from '../dtos/res/full-video.dto'
import { VideoStatusDto } from '../dtos/res/video-status.dto'
import { BlocksMapper } from 'src/features/learning-objects/blocks/mappers/blocks.mapper'

type LoWithSource = LearningObject & { contentSource: ContentSource }
type LoWithSourceAndBlocks = LoWithSource & { blocks: Block[] }

export class VideoMapper {
  static toDto(lo: LoWithSource): VideoDto {
    const cs = lo.contentSource
    return {
      id: cs.id,
      learningObjectId: lo.id,
      moduleId: lo.moduleId,
      title: lo.title,
      sourceKind: cs.kind,
      sourceUrl: cs.sourceUrl,
      status: cs.status,
      outputLanguage: cs.outputLanguage,
      durationSeconds: cs.durationSeconds,
      isPublished: lo.isPublished,
      errorMessage: cs.errorMessage,
      createdAt: lo.createdAt,
    }
  }

  static toFullDto(lo: LoWithSourceAndBlocks): FullVideoDto {
    const cs = lo.contentSource
    return {
      id: cs.id,
      learningObjectId: lo.id,
      moduleId: lo.moduleId,
      title: lo.title,
      sourceKind: cs.kind,
      sourceUrl: cs.sourceUrl,
      status: cs.status,
      outputLanguage: cs.outputLanguage,
      durationSeconds: cs.durationSeconds,
      detectedLanguage: cs.detectedLanguage,
      transcription: cs.rawText,
      isPublished: lo.isPublished,
      errorMessage: cs.errorMessage,
      metadata: cs.metadata as Record<string, unknown> | null,
      blocks: lo.blocks.map((block) => BlocksMapper.mapToDto(block)),
      createdAt: lo.createdAt,
    }
  }

  static toStatusDto(cs: ContentSource): VideoStatusDto {
    return {
      id: cs.id,
      status: cs.status,
      errorMessage: cs.errorMessage,
      startedAt: cs.createdAt,
      completedAt: cs.updatedAt,
    }
  }
}
