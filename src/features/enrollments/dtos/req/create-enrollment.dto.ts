import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty } from 'class-validator'

export class CreateEnrollmentDto {
  @ApiProperty({
    description: 'ID del módulo al que se quiere inscribir',
    example: 'clx1234567890',
  })
  @IsString()
  @IsNotEmpty()
  moduleId: string
}
