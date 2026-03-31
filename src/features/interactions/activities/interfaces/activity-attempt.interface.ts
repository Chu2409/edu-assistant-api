import { ApiProperty } from '@nestjs/swagger'

export class MultipleChoiceAttempt {
  @ApiProperty({
    example: 2,
    minimum: 0,
    maximum: 3,
    description: 'Índice de la opción seleccionada (0-3)',
  })
  selectedOption: number
}

export class TrueFalseAttempt {
  @ApiProperty({
    example: true,
    description: 'Respuesta del estudiante (true o false)',
  })
  answer: boolean
}

export class FillBlankAttempt {
  @ApiProperty({
    example: 'mitocondria',
    description: 'Texto ingresado por el estudiante',
  })
  answer: string
}

export class MatchAttempt {
  @ApiProperty({
    example: [2, 0, 3, 1],
    description:
      'Array de índices. matches[i] = índice del "right" que corresponde al "left" en posición i',
  })
  matches: number[]
}

export type ActivityAttemptAnswer =
  | MultipleChoiceAttempt
  | TrueFalseAttempt
  | FillBlankAttempt
  | MatchAttempt
