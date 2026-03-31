import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsEmail, Matches } from 'class-validator'

export class TeacherEmailsDto {
  @ApiProperty({
    type: [String],
    description:
      'Lista de correos que serán tratados como profesores (solo dominio @uta.edu.ec)',
    example: ['profesor1@uta.edu.ec', 'docente2@uta.edu.ec'],
  })
  @IsArray()
  @IsEmail({}, { each: true })
  @Matches(/@uta\.edu\.ec$/i, {
    each: true,
    message: 'Todos los correos deben pertenecer al dominio @uta.edu.ec',
  })
  emails: string[]
}
