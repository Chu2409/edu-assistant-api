import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsObject } from 'class-validator'

export class CreateActivityAttemptDto {
  @ApiProperty({
    description: 'Respuesta del estudiante (JSON)',
    example: { value: true },
  })
  @IsObject()
  @IsNotEmpty()
  studentAnswer: Record<string, any>
}
