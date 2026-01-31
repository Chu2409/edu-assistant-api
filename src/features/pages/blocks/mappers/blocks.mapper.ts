import { Block } from 'src/core/database/generated/client'
import { BlockDto } from '../dtos/res/block.dto'

export class BlocksMapper {
  static mapToDto(block: Block): BlockDto {
    return {
      id: block.id,
      type: block.type,
      content:
        typeof block.content === 'string'
          ? JSON.parse(block.content)
          : block.content,
      tipTapContent:
        typeof block.tipTapContent === 'string'
          ? JSON.parse(block.tipTapContent)
          : (block.tipTapContent ?? null),
    }
  }
}
