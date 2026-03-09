import { PageConcept } from 'src/core/database/generated/client'
import { PageConceptDto } from '../dtos/res/page-concept.dto'

export class PageConceptsMapper {
  static toDto(entity: PageConcept): PageConceptDto {
    return {
      id: entity.id,
      pageId: entity.pageId,
      term: entity.term,
      definition: entity.definition,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }
  }
}
