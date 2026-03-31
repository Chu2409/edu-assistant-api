import { ApiProperty, getSchemaPath } from '@nestjs/swagger'
import { BlockType } from 'src/core/database/generated/enums'

export class AiTextBlock {
  @ApiProperty({
    description: 'Contenido en formato Markdown',
    example: '# Título\n\nEste es un párrafo con **texto en negrita**.',
  })
  markdown: string
}

export class AiCodeBlock {
  @ApiProperty({
    description: 'Lenguaje de programación del código',
    example: 'typescript',
  })
  language: string

  @ApiProperty({
    description: 'Código fuente',
    example: 'const greeting = "Hello, World!"\nconsole.log(greeting)',
  })
  code: string
}

export class AiImageSuggestionBlock {
  @ApiProperty({
    description: 'Prompt para generar la imagen',
    example: 'Un diagrama que muestra el flujo de datos en una aplicación web',
  })
  prompt: string

  @ApiProperty({
    description: 'Razón por la que se sugiere esta imagen',
    example: 'Ayuda a visualizar el concepto de flujo de datos',
  })
  reason: string
}

export type AiContent = AiTextBlock | AiCodeBlock | AiImageSuggestionBlock

export class AiContentBlock {
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
    oneOf: [
      { $ref: getSchemaPath(AiTextBlock) },
      { $ref: getSchemaPath(AiCodeBlock) },
      { $ref: getSchemaPath(AiImageSuggestionBlock) },
    ],
  })
  content: AiContent
}
