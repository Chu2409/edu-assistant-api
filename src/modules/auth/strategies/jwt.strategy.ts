import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { JwtPayload } from '../types/jwt-payload.interface'
import { Request } from 'express'
import { CustomConfigService } from 'src/core/config/config.service'
import { USER_STATUS } from 'src/modules/users/types/user-status.enum'
import { UsersService } from 'src/modules/users/users.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: CustomConfigService,
  ) {
    super({
      secretOrKey: configService.env.JWT_SECRET,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    })
  }

  authenticate(req: Request, options?: unknown): void {
    if (!req.headers.authorization) {
      throw new UnauthorizedException('Token not found')
    }

    super.authenticate(req, options)
  }

  async validate(payload: JwtPayload) {
    console.log(1)

    const { id } = payload
    const userFound = await this.usersService.findOne(id)

    if (userFound.status !== USER_STATUS.ACTIVE)
      throw new UnauthorizedException('User is inactive, talk with an admin')
    console.log(2)

    return userFound
  }
}
