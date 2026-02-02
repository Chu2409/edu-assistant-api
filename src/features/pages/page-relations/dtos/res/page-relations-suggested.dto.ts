import { ApiProperty } from '@nestjs/swagger'
import { RelationType } from 'src/core/database/generated/enums'

export class RelationAnchorDto {
  @ApiProperty({ example: 10 })
  blockId: number

  @ApiProperty({ example: 'respiración celular' })
  mentionText: string
}

export class PageRelationSuggestionDto {
  @ApiProperty({ example: 2 })
  relatedPageId: number

  @ApiProperty({ example: 'Fotosíntesis' })
  relatedPageTitle: string

  @ApiProperty({ example: 0.81 })
  similarityScore: number

  @ApiProperty({ enum: RelationType, example: RelationType.SEMANTIC })
  relationType: RelationType

  @ApiProperty({ type: [RelationAnchorDto] })
  anchors: RelationAnchorDto[]

  @ApiProperty({ example: 'Complementa el tema con un ejemplo aplicado.' })
  explanation: string
}

export class PageRelationsSuggestedDto {
  @ApiProperty({ type: [PageRelationSuggestionDto] })
  suggestions: PageRelationSuggestionDto[]
}
