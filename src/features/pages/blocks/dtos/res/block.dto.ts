import { ApiProperty } from '@nestjs/swagger'
import { BlockType } from 'src/core/database/generated/enums'
import type { AiContent } from 'src/features/pages/content-generation/interfaces/ai-generated-content.interface'

export class BlockDto {
  @ApiProperty({
    description: 'ID del bloque',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: 'Índice del bloque (0-based) para el orden de visualización',
    example: 0,
  })
  orderIndex: number

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
  content: AiContent

  @ApiProperty({
    description: 'Contenido TipTap en formato JSON',
    example: { type: 'doc', content: [] },
  })
  tipTapContent: Record<string, any> | null
}
