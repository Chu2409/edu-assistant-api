import { BlockType } from 'src/core/database/generated/client'

export const GENERATED_BLOCK_TYPES = [
  BlockType.SUMMARY,
  BlockType.FLASHCARDS,
  BlockType.QUIZ,
  BlockType.GLOSSARY,
] as const

export const MAX_FLASHCARDS = 10

export const MAX_QUIZ_QUESTIONS = 5

export const VIDEO_FILE_MAX_SIZE_MB = 500

export const VIDEO_FILE_MAX_SIZE_BYTES = VIDEO_FILE_MAX_SIZE_MB * 1024 * 1024

export const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/mp2t',
]

export const VIDEO_LO_TYPE_NAME = 'VIDEO'

export const VIDEO_UPLOAD_DIR = './uploads/videos'
