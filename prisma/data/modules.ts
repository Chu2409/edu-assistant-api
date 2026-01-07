import { PrismaClient } from '@prisma/client/extension'
import { Prisma } from 'src/core/database/generated/client'

const module1 = (teacherId: number): Prisma.ModuleCreateInput => ({
  title: 'Introducción a la Programación',
  description: 'Este módulo introduce los conceptos básicos de programación',
  teacher: {
    connect: {
      id: teacherId,
    },
  },
  isPublic: false,
  allowSelfEnroll: true,
  allowSelfUnenroll: true,
})

export const createModule1 = async (
  prisma: PrismaClient,
  teacherId: number,
) => {
  return await prisma.module.create({
    data: module1(teacherId),
  })
}
