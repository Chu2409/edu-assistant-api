export class AiFormatValidationException extends Error {
  constructor(public readonly issues: string) {
    super(`AI response format validation failed: ${issues}`)
    this.name = 'AiFormatValidationError'
  }
}
