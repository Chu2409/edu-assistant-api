import { Global, Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt'
import { JwtStrategy } from './strategies/jwt.strategy'
import { CustomConfigService } from 'src/global/config/config.service'
import { UsersModule } from '../users/users.module'

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [CustomConfigService],
      useFactory: (configService: CustomConfigService) => ({
        secret: configService.env.JWT_SECRET,
        signOptions: { expiresIn: '2h' },
      }),
      global: true,
    }),
  ],
  exports: [PassportModule, AuthService],
})
export class AuthModule {}
