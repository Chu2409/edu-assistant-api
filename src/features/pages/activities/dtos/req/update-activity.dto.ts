import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator'
import { ActivityType } from 'src/core/database/generated/enums'

export class UpdateActivityDto {
  @ApiPropertyOptional({ enum: ActivityType })
  @IsOptional()
  @IsEnum(ActivityType)
  type?: ActivityType

  @ApiPropertyOptional({ description: 'Enunciado/pregunta' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  question?: string

  @ApiPropertyOptional({ description: 'Opciones (JSON)' })
  @IsOptional()
  @IsObject()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options?: Record<string, any> | null

  @ApiPropertyOptional({ description: 'Respuesta correcta (JSON)' })
  @IsOptional()
  @IsObject()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  correctAnswer?: Record<string, any>

  @ApiPropertyOptional({ description: 'Explicación' })
  @IsOptional()
  @IsString()
  explanation?: string | null

  @ApiPropertyOptional({ description: 'Dificultad 1-5' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number

  @ApiPropertyOptional({ description: 'Aprobada por el profesor' })
  @IsOptional()
  @IsBoolean()
  isApprovedByTeacher?: boolean

  @ApiPropertyOptional({ description: 'Usada como ejemplo' })
  @IsOptional()
  @IsBoolean()
  usedAsExample?: boolean
}
