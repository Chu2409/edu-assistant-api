import { Logger } from '@nestjs/common'
import { PrismaClient } from 'src/core/database/generated/client'
import { PrismaPg } from '@prisma/adapter-pg'

import 'dotenv/config'

const adapter = new PrismaPg({
  connectionString: process.env.DB_URL,
})
const prisma = new PrismaClient({ adapter })

const main = async () => {
  await Promise.all([])
  // await createUser1(prisma)
  // await createUser2(prisma)
  // await createUser3(prisma)
  Logger.log('Seed data created successfully')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    Logger.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
