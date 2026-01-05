import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { JwtPayload } from '../interfaces/jwt-payload.interface'
import { CustomConfigService } from 'src/core/config/config.service'
import { User } from 'src/core/database/generated/client'
import { DBService } from 'src/core/database/database.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: CustomConfigService,
    private dbService: DBService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.env.JWT_SECRET,
    })
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.dbService.user.findFirst({
      where: {
        email: payload.email,
      },
    })

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado')
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario inactivo')
    }

    return user
  }
}
