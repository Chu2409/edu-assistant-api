import { ApiProperty } from '@nestjs/swagger'
import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator'
import { Type } from 'class-transformer'
import { UpsertBlockDto } from 'src/features/learning-objects/blocks/dtos/req/upsert-block.dto'

export class UpdateLoContentDto {
  @ApiProperty({
    description: 'Lista de bloques para actualizar o crear en la página',
    type: [UpsertBlockDto],
    example: [
      {
        id: 1,
        orderIndex: 0,
        type: 'TEXT',
        content: { markdown: 'Contenido actualizado' },
        tipTapContent: { type: 'doc', content: [] },
      },
      {
        orderIndex: 1,
        type: 'CODE',
        content: {
          language: 'javascript',
          code: 'console.log("Nuevo bloque")',
        },
        tipTapContent: { type: 'doc', content: [] },
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpsertBlockDto)
  blocks: UpsertBlockDto[]
}
