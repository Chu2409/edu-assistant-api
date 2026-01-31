import {
  AiAudience,
  AiLength,
  AiTargetLevel,
  AiTone,
  Prisma,
  PrismaClient,
} from 'src/core/database/generated/client'

const aiConfiguration1 = (
  moduleId: number,
): Prisma.AiConfigurationCreateInput => ({
  language: 'es',
  module: {
    connect: {
      id: moduleId,
    },
  },
  audience: AiAudience.UNIVERSITY,
  contentLength: AiLength.MEDIUM,
  learningObjectives: ['Entender los conceptos básicos de programación'],
  targetLevel: AiTargetLevel.BASIC,
  tone: AiTone.EDUCATIONAL,
})

export const createAiConfiguration1 = async (
  prisma: PrismaClient,
  moduleId: number,
) => {
  const aiConfiguration = aiConfiguration1(moduleId)
  return await prisma.aiConfiguration.upsert({
    where: { moduleId },
    create: aiConfiguration,
    update: aiConfiguration,
  })
}
