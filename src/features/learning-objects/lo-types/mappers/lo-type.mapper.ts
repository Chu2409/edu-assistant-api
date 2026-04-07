import { LearningObjectType } from 'src/core/database/generated/client'
import { LoTypeDto } from '../dtos/lo-type.dto'

export class LoTypeMapper {
  static mapToDto(entity: LearningObjectType): LoTypeDto {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }
  }
}
