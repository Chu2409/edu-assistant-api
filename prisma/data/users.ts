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

const user3 = (): Prisma.UserCreateInput => ({
  email: 'jcamino7758@uta.edu.ec',
  name: 'Josue',
  lastName: 'Camino',
  microsoftId: 'seed-jcamino7758',
  displayName: 'Camino Josue',
  role: Role.TEACHER,
})

const upsertUser = async (prisma: PrismaClient, data: Prisma.UserCreateInput) =>
  prisma.user.upsert({
    where: { email: data.email },
    update: data,
    create: data,
  })

export const createUser1 = (prisma: PrismaClient) => upsertUser(prisma, user1())

export const createUser2 = (prisma: PrismaClient) => upsertUser(prisma, user2())

export const createUser3 = (prisma: PrismaClient) => upsertUser(prisma, user3())
