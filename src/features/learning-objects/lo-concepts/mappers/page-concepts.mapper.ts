import { LearningObjectConcept } from 'src/core/database/generated/client'
import { PageConceptDto } from '../dtos/res/page-concept.dto'

export class PageConceptsMapper {
  static toDto(entity: LearningObjectConcept): PageConceptDto {
    return {
      id: entity.id,
      pageId: entity.learningObjectId,
      term: entity.term,
      definition: entity.definition,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }
  }
}
