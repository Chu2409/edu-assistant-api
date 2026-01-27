export const cleanJsonResponse = (response: string): string => {
  return response
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()
}
