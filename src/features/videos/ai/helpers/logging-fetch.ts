import { Logger } from '@nestjs/common'

const logger = new Logger('NvidiaNimFetch')

const MAX_BODY_LOG_LENGTH = 2000

const shouldLogBody = (): boolean => process.env.NVIDIA_LOG_RAW_BODY === 'true'

export const loggingFetch: typeof fetch = async (input, init) => {
  const response = await fetch(input, init)

  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url

  if (!shouldLogBody()) {
    logger.debug(`status=${response.status} url=${url}`)
    return response
  }

  const cloned = response.clone()
  const bodyText = await cloned.text()
  const truncated =
    bodyText.length > MAX_BODY_LOG_LENGTH
      ? `${bodyText.slice(0, MAX_BODY_LOG_LENGTH)}... [truncated ${bodyText.length - MAX_BODY_LOG_LENGTH} chars]`
      : bodyText

  logger.debug(
    `status=${response.status} url=${url}\n--- RAW BODY ---\n${truncated}\n--- END ---`,
  )

  return new Response(bodyText, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
}
