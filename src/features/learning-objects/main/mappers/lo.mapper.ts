import {
  Block,
  Note,
  LearningObject,
  LearningObjectFeedback,
  StudentQuestion,
  User,
  Session,
  LearningObjectType,
} from 'src/core/database/generated/client'
import { LoDto } from '../dtos/res/lo.dto'
import { FullLoDto } from '../dtos/res/full-lo.dto'
import { StudentQuestionsMapper } from '../../../interactions/student-questions/mappers/student-questions.mapper'
import { LoFeedbacksMapper } from '../../../interactions/lo-feedbacks/mappers/lo-feedbacks.mapper'
import { NotesMapper } from '../../../interactions/notes/mappers/notes.mapper'
import { BlocksMapper } from '../../blocks/mappers/blocks.mapper'

export class LoMapper {
  static mapToDto(page: LearningObject & { type: LearningObjectType }): LoDto {
    return {
      id: page.id,
      moduleId: page.moduleId,
      title: page.title,
      type: page.type,
      orderIndex: page.orderIndex,
      keywords: page.keywords,
      isPublished: page.isPublished,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    }
  }

  static mapToFullLoDto(
    lo: LearningObject & {
      type: LearningObjectType
      notes?: Note[]
      studentQuestions: (StudentQuestion & { user: User })[]
      loFeedbacks?: (LearningObjectFeedback & { user: User })[]
      blocks: Block[]
      sessions?: Session[]
    },
  ): FullLoDto {
    return {
      id: lo.id,
      moduleId: lo.moduleId,
      title: lo.title,
      type: lo.type,
      orderIndex: lo.orderIndex,
      keywords: lo.keywords,
      isPublished: lo.isPublished,
      createdAt: lo.createdAt,
      updatedAt: lo.updatedAt,
      studentQuestions: lo.studentQuestions.map((studentQuestion) =>
        StudentQuestionsMapper.mapToDto(studentQuestion),
      ),
      loFeedbacks: lo.loFeedbacks
        ? lo.loFeedbacks.map((loFeedback) =>
            LoFeedbacksMapper.mapToDto(loFeedback),
          )
        : null,
      notes: lo.notes
        ? lo.notes.map((note) => NotesMapper.mapToDto(note))
        : null,
      chatSessionId: lo.sessions?.[0]?.id ?? null,
      blocks: lo.blocks.map((block) => BlocksMapper.mapToDto(block)),
    }
  }
}
