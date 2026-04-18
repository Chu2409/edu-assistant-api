import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsInt,
} from 'class-validator'
import { BlockType } from 'src/core/database/generated/client'

export class UpsertBlockDto {
  @ApiPropertyOptional({
    description:
      'ID del bloque (si existe, se actualiza; si no, se crea uno nuevo)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  id?: number

  @ApiPropertyOptional({
    description: 'Índice del bloque (0-based)',
    example: 0,
  })
  @IsOptional()
  @IsInt()
  orderIndex?: number

  @ApiProperty({
    description: 'Tipo de bloque',
    enum: BlockType,
    example: BlockType.TEXT,
  })
  @IsEnum(BlockType)
  @IsNotEmpty()
  type: BlockType

  @ApiProperty({
    description: 'Contenido del bloque en formato JSON',
    example: { text: 'Este es el contenido del bloque' },
  })
  @IsObject()
  @IsNotEmpty()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: Record<string, any>

  @ApiPropertyOptional({
    description:
      'Contenido TipTap en formato JSON. Opcional — puede omitirse o enviarse como null cuando el bloque no usa editor rich text (p. ej. bloques de video).',
    example: { type: 'doc', content: [] },
    nullable: true,
  })
  @IsOptional()
  @IsObject()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tipTapContent?: Record<string, any> | null
}
