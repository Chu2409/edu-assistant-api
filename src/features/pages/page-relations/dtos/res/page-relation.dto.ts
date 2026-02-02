import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { RelationType } from 'src/core/database/generated/enums'

export class RelatedPageMiniDto {
  @ApiProperty({ example: 2 })
  id: number

  @ApiProperty({ example: 'Fotosíntesis' })
  title: string
}

export class PageRelationDto {
  @ApiProperty({ example: 1 })
  id: number

  @ApiProperty({ example: 1 })
  originPageId: number

  @ApiProperty({ example: 2 })
  relatedPageId: number

  @ApiProperty({ example: 0.81 })
  similarityScore: number

  @ApiProperty({ enum: RelationType, example: RelationType.SEMANTIC })
  relationType: RelationType

  @ApiProperty({ example: 'respiración celular' })
  mentionText: string

  @ApiPropertyOptional({ example: 'Ambas páginas tratan energía celular.' })
  explanation: string | null

  @ApiProperty({ example: false })
  isEmbedded: boolean

  @ApiPropertyOptional()
  embeddedAt: Date | null

  @ApiProperty()
  calculatedAt: Date

  @ApiProperty()
  createdAt: Date

  @ApiProperty({ type: RelatedPageMiniDto })
  relatedPage: RelatedPageMiniDto
}
