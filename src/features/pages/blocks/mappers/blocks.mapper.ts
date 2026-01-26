import { Block } from 'src/core/database/generated/client'
import { BlockDto } from '../dtos/res/block.dto'

export class BlocksMapper {
  static mapToDto(block: Block): BlockDto {
    return {
      id: block.id,
      type: block.type,
      // @ts-expect-error asdsa
      content: JSON.parse(block.content),
    }
  }
}
