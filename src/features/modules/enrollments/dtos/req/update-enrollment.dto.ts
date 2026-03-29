import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsBoolean, IsOptional, IsDate } from 'class-validator'

export class UpdateEnrollmentDto {
  @ApiPropertyOptional({
    description: 'Indica si la inscripción está activa',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @ApiPropertyOptional({
    description: 'Fecha de finalización del módulo',
    example: '2024-12-31T23:59:59.000Z',
    nullable: true,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  completedAt?: Date
}
