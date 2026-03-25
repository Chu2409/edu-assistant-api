import { ApiProperty } from '@nestjs/swagger'
import { IsInt, IsNotEmpty } from 'class-validator'

export class CreateEnrollmentDto {
  @ApiProperty({
    description: 'ID del módulo al que se quiere inscribir',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  moduleId: number
}
