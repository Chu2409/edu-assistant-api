import {
  AiAudience,
  AiLength,
  AiTargetLevel,
  AiTone,
} from 'src/core/database/generated/enums'

export const getLengthGuidance = (length: AiLength) => {
  const guidance = {
    SHORT: '(aim for 3-6 blocks total, ~500-800 words)',
    MEDIUM: '(aim for 5-10 blocks total, ~1000-1500 words)',
    LONG: '(aim for 8-15 blocks total, ~2000-3000 words)',
  }
  return guidance[length] || ''
}

export const getAudienceGuidance = (audience: AiAudience) => {
  const guidance = {
    HIGH_SCHOOL: 'high school students (15-18 years)',
    UNIVERSITY: 'university students',
    PROFESSIONAL: 'working professionals',
  }
  return guidance[audience] || ''
}

export const getTargetLevelGuidance = (targetLevel: AiTargetLevel) => {
  const guidance = {
    BASIC: 'introductory, no prior knowledge assumed',
    INTERMEDIATE: 'some familiarity with the subject expected',
    ADVANCED: 'in-depth, assumes solid foundation',
  }
  return guidance[targetLevel] || ''
}

export const getToneGuidance = (tone: AiTone) => {
  const guidance = {
    FORMAL: 'formal and academic',
    EDUCATIONAL: 'clear and educational, approachable but professional',
    CASUAL: 'conversational and friendly',
  }
  return guidance[tone] || ''
}
