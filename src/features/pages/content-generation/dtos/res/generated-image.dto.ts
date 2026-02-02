import { ApiProperty } from '@nestjs/swagger'

export class GeneratedImageDto {
  @ApiProperty({
    description: 'Base64 de la imagen generada',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAKT2lDQ1BQaG90b3Nob3AgSUNAIG1hZ2VudGEAAAAQ...',
  })
  base64: string
}
