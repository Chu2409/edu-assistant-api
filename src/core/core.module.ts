import { Global, Module } from '@nestjs/common'
import { DBService } from './database/database.service'
import { CustomConfigService } from './config/config.service'
import { ConfigModule } from '@nestjs/config'
import { config, configValidationSchema } from './config/constants'
import { BullModule } from '@nestjs/bullmq'

@Global()
@Module({
  providers: [DBService, CustomConfigService],
  exports: [DBService, CustomConfigService],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: configValidationSchema,
      load: [config],
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    BullModule.forRootAsync({
      inject: [CustomConfigService],
      useFactory: (configService: CustomConfigService) => ({
        connection: {
          host: configService.env.REDIS_HOST,
          port: configService.env.REDIS_PORT,
        },
      }),
    }),
  ],
})
export class CoreModule {}
