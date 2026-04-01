import {
  Block,
  Note,
  LearningObject,
  LearningObjectFeedback,
  StudentQuestion,
  User,
  Session,
} from 'src/core/database/generated/client'
import { LoDto } from '../dtos/res/lo.dto'
import { FullLoDto } from '../dtos/res/full-lo.dto'
import { StudentQuestionsMapper } from '../../../interactions/student-questions/mappers/student-questions.mapper'
import { LoFeedbacksMapper } from '../../../interactions/lo-feedbacks/mappers/lo-feedbacks.mapper'
import { NotesMapper } from '../../../interactions/notes/mappers/notes.mapper'
import { BlocksMapper } from '../../blocks/mappers/blocks.mapper'

export class LoMapper {
  static mapToDto(page: LearningObject): LoDto {
    return {
      id: page.id,
      moduleId: page.moduleId,
      title: page.title,
      orderIndex: page.orderIndex,
      keywords: page.keywords,
      isPublished: page.isPublished,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    }
  }

  static mapToFullPageDto(
    page: LearningObject & {
      notes?: Note[]
      studentQuestions: (StudentQuestion & { user: User })[]
      pageFeedbacks?: (LearningObjectFeedback & { user: User })[]
      blocks: Block[]
      sessions?: Session[]
    },
  ): FullLoDto {
    return {
      id: page.id,
      moduleId: page.moduleId,
      title: page.title,
      orderIndex: page.orderIndex,
      keywords: page.keywords,
      isPublished: page.isPublished,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      studentQuestions: page.studentQuestions.map((studentQuestion) =>
        StudentQuestionsMapper.mapToDto(studentQuestion),
      ),
      pageFeedbacks: page.pageFeedbacks
        ? page.pageFeedbacks.map((pageFeedback) =>
            LoFeedbacksMapper.mapToDto(pageFeedback),
          )
        : null,
      notes: page.notes
        ? page.notes.map((note) => NotesMapper.mapToDto(note))
        : null,
      chatSessionId: page.sessions?.[0]?.id ?? null,
      blocks: page.blocks.map((block) => BlocksMapper.mapToDto(block)),
    }
  }
}
