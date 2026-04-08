import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class LoTypeDto {
  @ApiProperty({ example: 1 })
  id: number

  @ApiProperty({ example: 'Lección Interactiva' })
  name: string

  @ApiPropertyOptional({ example: 'Descripción...', nullable: true })
  description?: string | null

  @ApiProperty({ example: '2026-04-07T12:00:00Z' })
  createdAt: Date

  @ApiProperty({ example: '2026-04-07T12:00:00Z' })
  updatedAt: Date
}
