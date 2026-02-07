import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class UpdateStudentQuestionDto {
  @ApiProperty({
    description: 'La pregunta del estudiante',
    example: '¿Qué es la programación orientada a objetos?',
    required: false,
  })
  @IsString()
  @IsOptional()
  question?: string

  @ApiProperty({
    description: 'Indica si la pregunta es pública (visible en el foro)',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean
}
