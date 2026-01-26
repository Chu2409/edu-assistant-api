import {
  Block,
  Note,
  Page,
  PageFeedback,
  StudentQuestion,
  User,
} from 'src/core/database/generated/client'
import { PageDto } from '../dtos/res/page.dto'
import { FullPageDto } from '../dtos/res/full-page.dto'
import { StudentQuestionsMapper } from '../../student-questions/mappers/student-questions.mapper'
import { PageFeedbacksMapper } from '../../page-feedbacks/mappers/page-feedbacks.mapper'
import { NotesMapper } from '../../notes/mappers/notes.mapper'
import { BlocksMapper } from '../../blocks/mappers/blocks.mapper'

export class PagesMapper {
  static mapToDto(page: Page): PageDto {
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
    page: Page & {
      notes?: Note[]
      studentQuestions: (StudentQuestion & { user: User })[]
      pageFeedbacks?: (PageFeedback & { user: User })[]
      blocks: Block[]
    },
  ): FullPageDto {
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
            PageFeedbacksMapper.mapToDto(pageFeedback),
          )
        : null,
      notes: page.notes
        ? page.notes.map((note) => NotesMapper.mapToDto(note))
        : null,
      blocks: page.blocks.map((block) => BlocksMapper.mapToDto(block)),
    }
  }
}
