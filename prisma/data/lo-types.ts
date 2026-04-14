import { PrismaClient } from 'src/core/database/generated/client'

export const seedLoTypes = async (prisma: PrismaClient) => {
  await prisma.learningObjectType.upsert({
    where: { name: 'VIDEO' },
    update: {},
    create: {
      name: 'VIDEO',
      description: 'Video-based learning object with AI-generated content',
    },
  })
}
