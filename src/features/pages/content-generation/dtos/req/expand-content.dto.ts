import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsInt,
  Min,
  MaxLength,
  IsOptional,
  IsEnum,
} from 'class-validator'

export enum ExpandInsertPosition {
  BEFORE = 'before',
  AFTER = 'after',
  REPLACE = 'replace',
}

export class ExpandContentDto {
  @ApiProperty({
    description: 'ID de la página donde expandir el contenido',
    example: 1,
  })
  @IsInt()
  @Min(1)
  pageId: number

  @ApiProperty({
    description: 'Instrucciones para el contenido a generar',
    example: 'Añade una sección sobre buenas prácticas',
    maxLength: 1000,
  })
  @IsString()
  @MaxLength(1000)
  instruction: string

  @ApiProperty({
    description: 'Posición de inserción del nuevo contenido',
    enum: ExpandInsertPosition,
    example: ExpandInsertPosition.AFTER,
  })
  @IsEnum(ExpandInsertPosition)
  insertPosition: ExpandInsertPosition

  @ApiPropertyOptional({
    description:
      'Índice del bloque de referencia (0-based). Si no se especifica, se agrega al final',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  targetBlockIndex?: number
}
