import { Prisma, PrismaClient, Role } from 'src/core/database/generated/client'
import { hashPassword } from 'src/shared/utils/encrypter'

const user1 = (): Prisma.UserCreateInput => ({
  email: 'pepito123@gmail.com',
  password: hashPassword('123456'),
  firstName: 'Pepito',
  lastName: 'Perez',
  role: Role.STUDENT,
})

const user2 = (): Prisma.UserCreateInput => ({
  email: 'jperez1231@uta.edu.ec',
  password: hashPassword('123456'),
  firstName: 'Juan',
  lastName: 'Perez',
  role: Role.TEACHER,
})

const user3 = (): Prisma.UserCreateInput => ({
  email: 'test123@prueba.edu.ec',
  password: hashPassword('123456'),
  firstName: 'Test',
  lastName: 'Prueba',
  role: Role.STUDENT,
})

export const createUser1 = (prisma: PrismaClient) => {
  const user = user1()
  return prisma.user.upsert({
    create: user,
    update: user,
    where: {
      email: user.email,
    },
  })
}

export const createUser2 = (prisma: PrismaClient) => {
  const user = user2()
  return prisma.user.upsert({
    create: user,
    update: user,
    where: {
      email: user.email,
    },
  })
}

export const createUser3 = (prisma: PrismaClient) => {
  const user = user3()
  return prisma.user.upsert({
    create: user,
    update: user,
    where: {
      email: user.email,
    },
  })
}
