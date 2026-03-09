import { ApiProperty } from '@nestjs/swagger'

export class SessionDto {
  @ApiProperty({ example: 1 })
  id: number

  @ApiProperty({ example: 1 })
  pageId: number

  @ApiProperty({ example: 1 })
  userId: number

  @ApiProperty({ example: 'Chat: Introducción a...' })
  title: string

  @ApiProperty()
  startedAt: Date

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date
}
