import { Block } from 'src/core/database/generated/client'
import { BlockDto } from '../dtos/res/block.dto'
import { parseJsonField } from 'src/providers/ai/helpers/utils'
import { AiContent } from '../../content-generation/interfaces/ai-generated-content.interface'

export class BlocksMapper {
  static mapToDto(block: Block): BlockDto {
    return {
      id: block.id,
      orderIndex: block.orderIndex,
      type: block.type,
      content: parseJsonField<AiContent>(block.content),
      tipTapContent: parseJsonField<Record<string, unknown> | null>(
        block.tipTapContent,
      ),
    }
  }
}
