import { PrismaClient } from '@prisma/client/extension'
import { Prisma } from 'src/core/database/generated/client'

const enrollment1 = (
  userId: number,
  moduleId: number,
): Prisma.EnrollmentCreateInput => ({
  user: {
    connect: {
      id: userId,
    },
  },
  module: {
    connect: {
      id: moduleId,
    },
  },
})

export const createEnrollment1 = async (
  prisma: PrismaClient,
  userId: number,
  moduleId: number,
) => {
  await prisma.enrollment.create({
    data: enrollment1(userId, moduleId),
  })
}
