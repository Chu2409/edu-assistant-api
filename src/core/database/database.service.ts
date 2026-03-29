// db.service.ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { CustomConfigService } from '../config/config.service'
import { PrismaClient } from './generated/client'

@Injectable()
export class DBService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly configService: CustomConfigService) {
    const adapter = new PrismaPg({
      connectionString: configService.env.DB_URL,
    })
    super({ adapter })
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
