import { ApiProperty } from '@nestjs/swagger'

export class AvailableModelsResponseDto {
  @ApiProperty({
    description: 'Lista de modelos disponibles',
    type: [String],
    example: ['gpt-5-mini', 'gpt-5', 'gpt-4o'],
  })
  models: string[]
}
