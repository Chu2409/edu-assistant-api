import * as Joi from 'joi'
import { IConfig } from '../types'

export const config = (): { APP: IConfig } => ({
  APP: {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    DB_URL: process.env.DB_URL!,
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:4200',
    MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID!,
    MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET!,
    MICROSOFT_CALLBACK_URL: process.env.MICROSOFT_CALLBACK_URL!,
    MICROSOFT_TENANT: process.env.MICROSOFT_TENANT || 'organizations',
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRATION: process.env.JWT_EXPIRATION || '24h',
  },
})

export const configValidationSchema = Joi.object<IConfig>({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  DB_URL: Joi.string().required(),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:4200'),
  MICROSOFT_CLIENT_ID: Joi.string().required(),
  MICROSOFT_CLIENT_SECRET: Joi.string().required(),
  MICROSOFT_CALLBACK_URL: Joi.string().uri().required(),
  MICROSOFT_TENANT: Joi.alternatives()
    .try(
      Joi.string().valid('common', 'organizations', 'consumers'),
      Joi.string().pattern(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      ), // Permite también GUIDs de tenant específico
    )
    .default('organizations'),
  JWT_SECRET: Joi.string().min(30).required(),
  JWT_EXPIRATION: Joi.string().default('24h'),
})
