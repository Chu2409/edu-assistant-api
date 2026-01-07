import { Logger } from '@nestjs/common'
import { PrismaClient } from 'src/core/database/generated/client'
import { PrismaPg } from '@prisma/adapter-pg'

import 'dotenv/config'
import { createUser1, createUser2 } from './data/users'
import { createModule1 } from './data/modules'
import { createEnrollment1 } from './data/enrollments'

const adapter = new PrismaPg({
  connectionString: process.env.DB_URL,
})
const prisma = new PrismaClient({ adapter })

const main = async () => {
  const teacher = await createUser1(prisma)
  const student = await createUser2(prisma)

  const module = await createModule1(prisma, teacher.id)
  await createEnrollment1(prisma, student.id, module.id)
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
