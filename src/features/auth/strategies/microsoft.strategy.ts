import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-microsoft'
import { CustomConfigService } from 'src/core/config/config.service'
import { DBService } from 'src/core/database/database.service'
import { User } from 'src/core/database/generated/client'
import { AuthService } from '../auth.service'

interface MicrosoftProfileName {
  familyName: string
  givenName: string
}

interface MicrosoftProfileEmail {
  type: string
  value: string
}

interface MicrosoftGraphUser {
  '@odata.context'?: string
  businessPhones: string[]
  displayName: string
  givenName: string
  jobTitle: string | null
  mail: string
  mobilePhone: string | null
  officeLocation: string | null
  preferredLanguage: string | null
  surname: string
  userPrincipalName: string
  id: string
}

export interface MicrosoftProfile {
  provider: string
  name: MicrosoftProfileName
  id: string
  displayName: string
  userPrincipalName: string
  emails: MicrosoftProfileEmail[]
  _raw: string
  _json: MicrosoftGraphUser
}

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(
    private readonly configService: CustomConfigService,
    private readonly dbService: DBService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.env.MICROSOFT_CLIENT_ID,
      clientSecret: configService.env.MICROSOFT_CLIENT_SECRET,
      callbackURL: configService.env.MICROSOFT_CALLBACK_URL,
      tenant: configService.env.MICROSOFT_TENANT,
      scope: ['user.read'],
    })
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: MicrosoftProfile,
  ): Promise<User> {
    const email =
      profile.emails[0]?.value ||
      profile._json.mail ||
      profile.userPrincipalName

    if (!email) {
      throw new UnauthorizedException('No se pudo obtener el email del usuario')
    }

    if (!email.endsWith('@uta.edu.ec')) {
      throw new UnauthorizedException(
        'Solo se permiten cuentas del dominio @uta.edu.ec',
      )
    }

    const user = await this.authService.validateUser({
      email,
      name: profile.name.givenName,
      lastName: profile.name.familyName,
      microsoftId: profile.id,
      displayName: profile.displayName,
    })

    return user
  }
}
