import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { MediaType } from 'src/core/database/generated/enums'

export class MediaResourceDto {
  @ApiProperty({ example: 1 })
  id: number

  @ApiProperty({ example: 1, nullable: true })
  pageId: number | null

  @ApiProperty({ enum: MediaType, example: MediaType.IMAGE })
  type: MediaType

  @ApiPropertyOptional({ example: 'Diagrama de flujo', nullable: true })
  title: string | null

  @ApiProperty({ example: 'https://example.com/image.png' })
  url: string

  @ApiPropertyOptional({
    example: 'https://example.com/thumb.png',
    nullable: true,
  })
  thumbnailUrl: string | null

  @ApiPropertyOptional({ example: 123456, nullable: true })
  fileSize: number | null

  @ApiPropertyOptional({ example: 'image/png', nullable: true })
  mimeType: string | null

  @ApiProperty()
  createdAt: Date
}
