import { ApiProperty } from '@nestjs/swagger'
import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator'
import { Type } from 'class-transformer'
import { UpsertBlockDto } from 'src/features/pages/blocks/dtos/req/upsert-block.dto'

export class UpdatePageContentDto {
  @ApiProperty({
    description: 'Lista de bloques para actualizar o crear en la página',
    type: [UpsertBlockDto],
    example: [
      {
        id: 1,
        type: 'TEXT',
        content: { text: 'Contenido actualizado' },
        tipTapContent: { type: 'doc', content: [] },
      },
      {
        type: 'CODE',
        content: {
          code: 'console.log("Nuevo bloque")',
          language: 'javascript',
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
