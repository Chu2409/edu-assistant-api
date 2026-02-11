import { ApiProperty } from '@nestjs/swagger'
import { BlockType } from 'src/core/database/generated/enums'
import { AiContentBlock } from '../../interfaces/ai-generated-content.interface'

export class ExpandedContentDto {
  @ApiProperty({
    description: 'Bloques de contenido generados para expandir la lección',
    type: [AiContentBlock],
    example: [
      {
        type: BlockType.TEXT,
        content: {
          markdown:
            '# Introducción\n\nTypeScript es un lenguaje de programación...',
        },
      },
      {
        type: BlockType.CODE,
        content: {
          language: 'typescript',
          code: 'const greeting: string = "Hello, World!"\nconsole.log(greeting)',
        },
      },
      {
        type: BlockType.IMAGE_SUGGESTION,
        content: {
          prompt:
            'Ejemplo gráfico de herencia en Java mostrando una clase Animal y subclases Perro y Gato, con flechas que indican la relación de herencia, estilo diagrama UML simplificado y claro para estudiantes universitarios.',
          reason:
            'Para ilustrar visualmente la herencia como concepto clave en Java.',
        },
      },
    ],
  })
  blocks: AiContentBlock[]
}
