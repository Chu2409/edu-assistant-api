import { IsBoolean, IsInt, IsOptional } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class MarkLoVisitedDto {
  @ApiProperty({ description: 'ID del objeto de aprendizaje', example: 1 })
  @IsInt()
  learningObjectId: number

  @ApiProperty({
    description: 'Marcar como completado',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean
}
