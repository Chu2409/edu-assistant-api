const languageNames = new Intl.DisplayNames(['en'], {
  type: 'language',
})

/**
 * Resolves an ISO language code (e.g., 'es', 'en') to its full natural language name in English (e.g., 'Spanish', 'English').
 * If resolution fails, returns the original code.
 */
export const resolveLanguageName = (code: string): string => {
  try {
    return languageNames.of(code) ?? code
  } catch {
    return code
  }
}
