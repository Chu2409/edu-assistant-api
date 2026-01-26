import { AiLength } from 'src/core/database/generated/enums'

export const getLengthGuidance = (length: AiLength) => {
  const guidance = {
    SHORT: '(aim for 3-6 blocks total, ~500-800 words)',
    MEDIUM: '(aim for 5-10 blocks total, ~1000-1500 words)',
    LONG: '(aim for 8-15 blocks total, ~2000-3000 words)',
  }
  return guidance[length] || ''
}
