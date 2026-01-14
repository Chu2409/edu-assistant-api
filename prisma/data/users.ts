import { Prisma, PrismaClient, Role } from 'src/core/database/generated/client'

const user1 = (): Prisma.UserCreateInput => ({
  email: 'ezhu7643@uta.edu.ec',
  name: 'Erick',
  lastName: 'Zhu',
  microsoftId: 'aa0404b9-cefe-4513-8389-86840532269e',
  displayName: 'Zhu Ordoñez Erick Daniel',
  role: Role.TEACHER,
})

const user2 = (): Prisma.UserCreateInput => ({
  email: 'egalarza7363@uta.edu.ec',
  name: 'Emilia',
  lastName: 'Galarza',
  microsoftId: '188c781f-b117-4da1-a1ec-3fd2188fbc25',
  displayName: 'Galarza Flores Emilia Domenica',
  role: Role.STUDENT,
})

export const createUser1 = async (prisma: PrismaClient) => {
  const user = user1()
  return await prisma.user.upsert({
    where: { email: user.email },
    update: user,
    create: user,
  })
}

export const createUser2 = async (prisma: PrismaClient) => {
  const user = user2()
  return await prisma.user.upsert({
    where: { email: user.email },
    update: user,
    create: user,
  })
}
