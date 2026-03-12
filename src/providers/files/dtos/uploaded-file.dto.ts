import { ApiProperty } from '@nestjs/swagger'

export class UploadedFileDto {
  @ApiProperty({
    example:
      'https://example.com/uploads/123e4567-e89b-12d3-a456-426614174000.jpg',
  })
  url: string

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000.jpg',
  })
  filename: string

  @ApiProperty({
    example: 'image.jpg',
  })
  originalName: string

  @ApiProperty({
    example: 1024,
  })
  size: number

  @ApiProperty({
    example: 'image/jpeg',
  })
  mimetype: string
}
