import { ApiProperty } from '@nestjs/swagger'
import { IsArray, ArrayMinSize, IsInt } from 'class-validator'

export class BulkEnrollStudentsDto {
  @ApiProperty({
    description: 'ID del módulo',
    example: 1,
  })
  @IsInt()
  moduleId: number

  @ApiProperty({
    description: 'Lista de IDs de estudiantes a inscribir',
    example: [1, 2],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  studentIds: number[]
}
