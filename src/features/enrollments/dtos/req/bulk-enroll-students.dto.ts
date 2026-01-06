import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsString, ArrayMinSize } from 'class-validator'

export class BulkEnrollStudentsDto {
  @ApiProperty({
    description: 'ID del módulo',
    example: 'clx1234567890',
  })
  @IsString()
  moduleId: string

  @ApiProperty({
    description: 'Lista de IDs de estudiantes a inscribir',
    example: ['clx0987654321', 'clx1122334455'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  studentIds: string[]
}
