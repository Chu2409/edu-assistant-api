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

    REDIS_HOST: process.env.REDIS_HOST!,
    REDIS_PORT: process.env.REDIS_PORT
      ? parseInt(process.env.REDIS_PORT, 10)
      : 6379,

    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,

    VIDEO_AI_PROVIDER: process.env.VIDEO_AI_PROVIDER || 'groq',
    VIDEO_AI_MODEL: process.env.VIDEO_AI_MODEL || 'llama-3.3-70b-versatile',
    GROQ_API_KEY: process.env.GROQ_API_KEY || '',
    GOOGLE_GENERATIVE_AI_API_KEY:
      process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
    NVIDIA_API_KEY: process.env.NVIDIA_API_KEY || '',
    NVIDIA_BASE_URL:
      process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    VIDEO_AI_REQUEST_TIMEOUT: process.env.VIDEO_AI_REQUEST_TIMEOUT
      ? parseInt(process.env.VIDEO_AI_REQUEST_TIMEOUT, 10)
      : 120000,

    WHISPER_MODEL: process.env.WHISPER_MODEL || 'base',
    WHISPER_LANGUAGE: process.env.WHISPER_LANGUAGE || 'auto',

    MAX_VIDEO_DURATION_MINUTES: process.env.MAX_VIDEO_DURATION_MINUTES
      ? parseInt(process.env.MAX_VIDEO_DURATION_MINUTES, 10)
      : 30,
    MAX_VIDEO_FILE_SIZE_MB: process.env.MAX_VIDEO_FILE_SIZE_MB
      ? parseInt(process.env.MAX_VIDEO_FILE_SIZE_MB, 10)
      : 500,
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

  REDIS_HOST: Joi.string().hostname().required(),
  REDIS_PORT: Joi.number().default(6379),

  OPENAI_API_KEY: Joi.string(),

  VIDEO_AI_PROVIDER: Joi.string()
    .valid('groq', 'openai', 'google', 'nvidia', 'ollama')
    .default('groq'),
  VIDEO_AI_MODEL: Joi.string().default('llama-3.3-70b-versatile'),
  GROQ_API_KEY: Joi.string().allow('').default(''),
  GOOGLE_GENERATIVE_AI_API_KEY: Joi.string().allow('').default(''),
  NVIDIA_API_KEY: Joi.string().allow('').default(''),
  NVIDIA_BASE_URL: Joi.string()
    .uri()
    .default('https://integrate.api.nvidia.com/v1'),
  OLLAMA_BASE_URL: Joi.string().uri().default('http://localhost:11434'),
  VIDEO_AI_REQUEST_TIMEOUT: Joi.number().default(120000),

  WHISPER_MODEL: Joi.string()
    .valid('tiny', 'base', 'small', 'medium', 'large-v3')
    .default('base'),
  WHISPER_LANGUAGE: Joi.string().default('auto'),

  MAX_VIDEO_DURATION_MINUTES: Joi.number().min(1).default(30),
  MAX_VIDEO_FILE_SIZE_MB: Joi.number().min(1).default(500),
})
