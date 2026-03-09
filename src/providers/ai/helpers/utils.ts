export const cleanJsonResponse = (response: string): string => {
  return response
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()
}

export const parseJsonField = <T = Record<string, unknown>>(
  value: unknown,
): T => {
  if (typeof value === 'string') return JSON.parse(value) as T
  return value as T
}
