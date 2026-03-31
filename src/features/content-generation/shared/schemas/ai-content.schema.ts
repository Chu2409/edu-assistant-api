import { BlockType } from 'src/core/database/generated/enums'
import { z } from 'zod'

// --- Shared Content Block Schemas ---

const aiTextBlockSchema = z.object({
  type: z.literal(BlockType.TEXT),
  content: z.object({
    markdown: z.string().min(1),
  }),
})

const aiCodeBlockSchema = z.object({
  type: z.literal(BlockType.CODE),
  content: z.object({
    code: z.string().min(1),
    language: z.string().min(1),
  }),
})

const aiImageSuggestionBlockSchema = z.object({
  type: z.literal(BlockType.IMAGE_SUGGESTION),
  content: z.object({
    prompt: z.string().min(1),
    reason: z.string().min(1),
  }),
})

/**
 * Discriminated union for all supported block types.
 * This ensures strict validation of the 'content' field based on the 'type'.
 */
const aiContentBlockSchema = z.discriminatedUnion('type', [
  aiTextBlockSchema,
  aiCodeBlockSchema,
  aiImageSuggestionBlockSchema,
])

// --- Page Content Responses ---

export const generatedPageContentSchema = z.object({
  title: z.string().min(1),
  keywords: z.array(z.string()),
  blocks: z.array(aiContentBlockSchema).min(1),
})

export const regeneratedBlockSchema = aiContentBlockSchema

export const expandedContentSchema = z.object({
  blocks: z.array(aiContentBlockSchema).min(1),
})

// --- Activities ---

const aiMultipleChoiceActivitySchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).length(4),
  correctAnswer: z.number().min(0).max(3),
  explanation: z.string().min(1),
})

const aiTrueFalseActivitySchema = z.object({
  statement: z.string().min(1),
  correctAnswer: z.boolean(),
  explanation: z.string().min(1),
})

const aiFillBlankActivitySchema = z.object({
  sentence: z.string().min(1),
  correctAnswer: z.string().min(1),
  acceptableAnswers: z.array(z.string()).min(1).max(3),
  explanation: z.string().min(1),
})

const aiMatchPairSchema = z.object({
  left: z.string().min(1),
  right: z.string().min(1),
})

const aiGeneratedMatchActivitySchema = z.object({
  instructions: z.string().min(1),
  pairs: z.array(aiMatchPairSchema).min(2),
})

/**
 * Schema for all AI-generated activities.
 * Since activities don't have a common 'type' discriminator in their root,
 * we use a standard union for the final response.
 */
export const aiGeneratedActivitySchema = z.union([
  aiMultipleChoiceActivitySchema,
  aiTrueFalseActivitySchema,
  aiFillBlankActivitySchema,
  aiGeneratedMatchActivitySchema,
])

// --- Concepts ---

const generatedConceptSchema = z.object({
  term: z.string().min(1),
  definition: z.string().min(1),
})

export const pageConceptsExtractedSchema = z.object({
  terms: z.array(generatedConceptSchema),
})

// --- Relations ---

const generatedRelationSchema = z.object({
  targetPageId: z.number(),
  mentionText: z.string().min(1),
})

export const generatedRelationsSchema = z.object({
  relations: z.array(generatedRelationSchema),
})
