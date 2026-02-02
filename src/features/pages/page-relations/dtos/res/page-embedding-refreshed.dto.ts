import { ApiProperty } from '@nestjs/swagger'

export class PageEmbeddingRefreshedDto {
  @ApiProperty({ example: 1 })
  pageId: number

  @ApiProperty({ example: true })
  compiledContentUpdated: boolean

  @ApiProperty({ example: true })
  embeddingUpdated: boolean

  @ApiProperty({ example: 842 })
  compiledContentLength: number
}
