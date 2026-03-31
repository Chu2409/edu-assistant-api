import { Block } from 'src/core/database/generated/client'
import { BlockType } from 'src/core/database/generated/enums'
import { BlocksMapper } from '../mappers/blocks.mapper'
import {
  AiCodeBlock,
  AiTextBlock,
} from 'src/features/content-generation/shared/interfaces/ai-generated-content.interface'

export function compileBlocksToText(blocks: Block[]): string {
  const mapped = blocks.map((b) => BlocksMapper.mapToDto(b))
  const parts: string[] = []

  for (const block of mapped) {
    if (block.type === BlockType.TEXT) {
      const markdown = String(
        (block.content as AiTextBlock).markdown || '',
      ).trim()
      if (markdown) parts.push(markdown)
    } else if (block.type === BlockType.CODE) {
      const lang = String((block.content as AiCodeBlock).language).trim()
      const code = String((block.content as AiCodeBlock).code).trim()
      if (code) parts.push(`Código (${lang || 'code'}):\n${code}`)
    }
  }

  return parts.join('\n\n---\n\n')
}
