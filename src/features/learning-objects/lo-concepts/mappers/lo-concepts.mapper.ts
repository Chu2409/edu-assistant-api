import { LearningObjectConcept } from 'src/core/database/generated/client'
import { LoConceptDto } from '../dtos/res/lo-concept.dto'

export class LoConceptsMapper {
  static toDto(entity: LearningObjectConcept): LoConceptDto {
    return {
      id: entity.id,
      learningObjectId: entity.learningObjectId,
      term: entity.term,
      definition: entity.definition,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }
  }
}
