import { ApiProperty } from '@nestjs/swagger'
import { BlockType } from 'src/core/database/generated/enums'
import {
  CodeBlock,
  ImageSuggestionBlock,
  TextBlock,
} from 'src/features/pages/content-generation/interfaces/content-block.interface'

export class BlockDto {
  @ApiProperty({
    description: 'ID de la página',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: 'Tipo de bloque de contenido',
    enum: BlockType,
    example: BlockType.TEXT,
  })
  type: BlockType

  @ApiProperty({
    description:
      'Contenido del bloque. Si type es TEXT, contiene { markdown: string }. Si type es CODE, contiene { language: string, code: string }. Si type es IMAGE_SUGGESTION, contiene { prompt: string, reason: string }',
    example: {
      markdown: '# Título\n\nEste es un párrafo con **texto en negrita**.',
    },
  })
  content: TextBlock | CodeBlock | ImageSuggestionBlock
}
