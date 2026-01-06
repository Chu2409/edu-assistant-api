import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { MicrosoftStrategy } from './strategies/microsoft.strategy'
import { JwtStrategy } from './strategies/jwt.strategy'
import { CustomConfigService } from 'src/core/config/config.service'

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: CustomConfigService) => ({
        secret: configService.env.JWT_SECRET,
        signOptions: {
          expiresIn: configService.env.JWT_EXPIRATION as unknown as number,
        },
      }),
      inject: [CustomConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, MicrosoftStrategy, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
