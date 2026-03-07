import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsEmail } from 'class-validator'

export class TeacherEmailsDto {
  @ApiProperty({
    type: [String],
    description: 'Lista de correos que serán tratados como profesores',
    example: ['profesor1@ejemplo.com', 'docente2@ejemplo.com'],
  })
  @IsArray()
  @IsEmail({}, { each: true })
  emails: string[]
}
