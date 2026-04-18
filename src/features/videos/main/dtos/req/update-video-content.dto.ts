import { ApiProperty } from '@nestjs/swagger'
import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator'
import { Type } from 'class-transformer'
import { UpsertBlockDto } from 'src/features/learning-objects/blocks/dtos/req/upsert-block.dto'

export class UpdateVideoContentDto {
  @ApiProperty({
    description:
      'Lista completa de bloques del video. Full replace: los bloques con id se actualizan, sin id se crean, y cualquier bloque existente no presente en la lista se elimina.',
    type: [UpsertBlockDto],
    example: [
      {
        id: 1,
        orderIndex: 0,
        type: 'SUMMARY',
        content: {
          title: 'Modified Title',
          summary: 'Teacher-edited summary.',
          whatYouLearn: ['...'],
          keyConcepts: ['...'],
          examples: ['...'],
        },
        tipTapContent: null,
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpsertBlockDto)
  blocks: UpsertBlockDto[]
}
