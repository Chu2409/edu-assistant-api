import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Role } from 'src/core/database/generated/enums'

export class UserDto {
  @ApiProperty({
    description: 'ID del usuario',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: 'Email del usuario',
    example: 'juan.perez@uta.edu.ec',
  })
  email: string

  @ApiProperty({
    description: 'Rol del usuario',
    enum: Role,
    example: Role.STUDENT,
  })
  role: Role

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan',
  })
  name: string

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Perez',
  })
  lastName: string

  @ApiProperty({
    description: 'Indica si el usuario está activo',
    example: true,
  })
  isActive: boolean

  @ApiProperty({
    description: 'ID único de Microsoft',
    example: 'aa0404b9-cefe-4513-8389-86840532269e',
  })
  microsoftId: string

  @ApiProperty({
    description: 'Nombre completo desde Microsoft',
    example: 'Juan Perez',
  })
  displayName: string

  @ApiPropertyOptional({
    description: 'URL de foto de perfil',
    example: 'https://example.com/profile.jpg',
    nullable: true,
  })
  profilePicture: string | null

  @ApiPropertyOptional({
    description: 'Última vez que inició sesión',
    example: '2024-01-01T00:00:00.000Z',
    nullable: true,
  })
  lastLoginAt: Date | null

  @ApiProperty({
    description: 'Fecha de creación del usuario',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date

  @ApiProperty({
    description: 'Fecha de última actualización del usuario',
    example: '2024-01-02T00:00:00.000Z',
  })
  updatedAt: Date
}
