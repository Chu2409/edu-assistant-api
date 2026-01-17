import {
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

export class PagesMapper {
  static mapToDto(page: Page): PageDto {
    return {
      id: page.id,
      moduleId: page.moduleId,
      title: page.title,
      content: page.content,
      orderIndex: page.orderIndex,
      keywords: page.keywords,
      isPublished: page.isPublished,
      lastProcessedAt: page.lastProcessedAt,
      processingVersion: page.processingVersion,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    }
  }

  static mapToFullPageDto(
    page: Page & {
      notes?: Note[]
      studentQuestions: (StudentQuestion & { user: User })[]
      pageFeedbacks?: (PageFeedback & { user: User })[]
    },
  ): FullPageDto {
    return {
      id: page.id,
      moduleId: page.moduleId,
      title: page.title,
      content: page.content,
      orderIndex: page.orderIndex,
      keywords: page.keywords,
      isPublished: page.isPublished,
      lastProcessedAt: page.lastProcessedAt,
      processingVersion: page.processingVersion,
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
    }
  }
}
