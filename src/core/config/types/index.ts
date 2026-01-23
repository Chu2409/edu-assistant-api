export interface IConfig {
  NODE_ENV: string
  PORT: number
  DB_URL: string
  FRONTEND_URL: string

  MICROSOFT_CLIENT_ID: string
  MICROSOFT_CLIENT_SECRET: string
  MICROSOFT_CALLBACK_URL: string
  MICROSOFT_TENANT: string

  JWT_SECRET: string
  JWT_EXPIRATION: string

  REDIS_HOST: string
  REDIS_PORT: number

  OPENAI_API_KEY: string
}
