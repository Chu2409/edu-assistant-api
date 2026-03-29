import { BlockType } from 'src/core/database/generated/enums'
import { z } from 'zod'

// --- Page Content ---

const aiContentBlockSchema = z.object({
  type: z.enum(BlockType),
  // Content structure varies by type — validated loosely
  content: z.any(),
})

export const generatedPageContentSchema = z.object({
  title: z.string().min(1),
  keywords: z.array(z.string()),
  blocks: z.array(aiContentBlockSchema).min(1),
})

export const regeneratedBlockSchema = z.object({
  type: z.enum(BlockType),
  content: z.any(),
})

export const expandedContentSchema = z.object({
  blocks: z.array(aiContentBlockSchema).min(1),
})

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
