import { Logger } from '@nestjs/common'

const logger = new Logger('NvidiaNimFetch')

export const loggingFetch: typeof fetch = async (input, init) => {
  const response = await fetch(input, init)
  const cloned = response.clone()
  const bodyText = await cloned.text()

  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url
  logger.debug(
    `status=${response.status} url=${url}\n--- RAW BODY ---\n${bodyText}\n--- END ---`,
  )

  return new Response(bodyText, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
}
