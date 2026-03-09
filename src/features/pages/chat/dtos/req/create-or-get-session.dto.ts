import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateOrGetSessionDto {
  @ApiPropertyOptional({
    description:
      'Título opcional para la sesión (si no existe se crea una nueva).',
    example: 'Dudas sobre la lección',
    minLength: 1,
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title?: string
}
