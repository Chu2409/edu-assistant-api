import { ApiProperty } from '@nestjs/swagger'
import { ContentBlock } from '../../interfaces/content-block.interface'

export class Content {
  @ApiProperty({
    description: 'Título del contenido generado',
    example: 'Introducción a TypeScript',
  })
  title: string

  @ApiProperty({
    description: 'Array de bloques de contenido',
    type: [ContentBlock],
    example: [
      {
        type: 'TEXT',
        content: {
          markdown:
            '# Introducción\n\nTypeScript es un lenguaje de programación...',
        },
      },
      {
        type: 'CODE',
        content: {
          language: 'typescript',
          code: 'const greeting: string = "Hello, World!"\nconsole.log(greeting)',
        },
      },
      {
        type: 'IMAGE_SUGGESTION',
        content: {
          prompt:
            'Ejemplo gráfico de herencia en Java mostrando una clase Animal y subclases Perro y Gato, con flechas que indican la relación de herencia, estilo diagrama UML simplificado y claro para estudiantes universitarios.',
          reason:
            'Para ilustrar visualmente la herencia como concepto clave en Java.',
        },
      },
    ],
  })
  blocks: ContentBlock[]
}

export class PageContentGeneratedDto {
  @ApiProperty({
    description: 'Contenido generado de la página',
    type: Content,
  })
  content: Content

  @ApiProperty({
    description: 'ID de la respuesta de la IA',
    example: 'resp_01ef58364b31c6f6006976e2c612a081a1ab6c980aae08f8e4',
  })
  responseId: string
}
