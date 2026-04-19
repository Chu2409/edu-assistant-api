import { Logger } from '@nestjs/common'
import { ZodSchema, ZodError } from 'zod'

const logger = new Logger('AiResponseValidator')

/**
 * Valida la respuesta de la IA contra un schema Zod.
 * Si la validación falla, loguea el error y lanza una excepción descriptiva.
 */
export function validateAiResponse<T>(data: unknown, schema: ZodSchema<T>): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ')

      logger.error(`Validación de respuesta de IA fallida: ${issues}`)
      logger.debug('Datos de respuesta de IA inválidos:', JSON.stringify(data))

      throw new Error(
        'La respuesta de la IA no tiene el formato esperado. Intenta generar de nuevo.',
      )
    }
    throw error
  }
}
