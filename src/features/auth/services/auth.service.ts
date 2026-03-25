import { Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { JwtPayload } from './../interfaces/jwt-payload.interface'
import { DBService } from 'src/core/database/database.service'
import { Role, User } from 'src/core/database/generated/client'
import { ValidateMicrosoftUserDto } from './../dtos/req/validate-microsoft-user.dto'
import { AuthConfigService } from './auth-config.service'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private jwtService: JwtService,
    private dbService: DBService,
    private authConfigService: AuthConfigService,
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
    const normalizedEmail = email.toLowerCase().trim()

    if (this.authConfigService.getTeacherEmails().includes(normalizedEmail)) {
      return Role.TEACHER
    }

    return Role.STUDENT
  }
}
