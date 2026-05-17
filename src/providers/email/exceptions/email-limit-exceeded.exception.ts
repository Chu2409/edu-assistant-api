import { HttpException, HttpStatus } from '@nestjs/common'

/**
 * Exception thrown when the daily email limit is exceeded.
 * This is a client-safe error (429 Too Many Requests).
 */
export class EmailLimitExceededException extends HttpException {
  constructor(
    public readonly retryAfterSeconds: number = 86400,
    public readonly limit: number = 1000,
  ) {
    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Daily email limit exceeded. Please try again later.',
        error: 'Too Many Requests',
        retryAfter: retryAfterSeconds,
        limit,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    )
  }
}
