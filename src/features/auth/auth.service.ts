import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { JwtPayload } from './interfaces/jwt-payload.interface'
import { DBService } from 'src/core/database/database.service'
import { Role, User } from 'src/core/database/generated/client'
import { ValidateMicrosoftUserDto } from './dtos/req/validate-microsoft-user.dto'

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private dbService: DBService,
  ) {}

  generateJwt(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
    }

    return this.jwtService.sign(payload)
  }

  verifyJwt(token: string) {
    try {
      return this.jwtService.verify<JwtPayload>(token)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new Error('Token inválido o expirado')
    }
  }

  async validateUser(dto: ValidateMicrosoftUserDto): Promise<User> {
    let user = await this.dbService.user.findUnique({
      where: { email: dto.email },
    })

    if (!user) {
      user = await this.dbService.user.create({
        data: {
          email: dto.email,
          role: this.determineUserRole(dto.email),
          microsoftId: dto.microsoftId,
          name: dto.name,
          lastName: dto.lastName,
          displayName: dto.displayName,
          lastLoginAt: new Date(),
        },
      })
    } else {
      user = await this.dbService.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
        },
      })
    }

    return user
  }

  private determineUserRole(email: string): Role {
    if (email.includes('profesor') || email.includes('docente')) {
      return Role.TEACHER
    }

    if (email.includes('admin')) {
      return Role.ADMIN
    }

    return Role.STUDENT
  }
}
