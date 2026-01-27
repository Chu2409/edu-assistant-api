import { Block } from 'src/core/database/generated/client'
import { GeneratePageContentPrompt } from './generate-page-content.prompt'
import { PromptInput } from '../interfaces/prompt-input.interface'

export interface RegeneratePageContentPrompt {
  currentBlocks: Block[]
  instruction: string
  config: GeneratePageContentPrompt
}

export const regeneratePageContentWithContextPrompt = ({
  instruction,
  config,
}: Omit<RegeneratePageContentPrompt, 'currentBlocks'>): PromptInput[] => [
    {
      role: 'user',
      content: `Please modify the lesson you previously generated based on these instructions:

# MODIFICATION INSTRUCTIONS
${instruction}

# IMPORTANT CONSTRAINTS
- Maintain the original configuration (Language: ${config.language}, Audience: ${config.audience}, Level: ${config.targetLevel}, Tone: ${config.tone})
- CRITICAL: Never create consecutive TEXT blocks - consolidate all sequential text into single blocks using markdown headers (##, ###)
- Return the COMPLETE updated lesson in the same JSON format you used before
- Make only the changes requested while preserving the overall structure and quality

# OUTPUT FORMAT
Return valid JSON only (no markdown fences, no explanations):
{
  "title": string,
  "blocks": [
    {
      "type": "TEXT" | "CODE" | "IMAGE_SUGGESTION",
      "content": { ... }
    }
  ]
}`,
    },
  ]

export const regenerateWithoutContextPrompt = ({
  currentBlocks,
  instruction,
  config,
}: RegeneratePageContentPrompt): PromptInput[] => [
    {
      role: 'system',
      content: `You are an expert educational content editor.
  
  # OUTPUT FORMAT (valid JSON only)
  {
    "title": string,
    "blocks": [
      {
        "type": "TEXT" | "CODE" | "IMAGE_SUGGESTION",
        "content": {
          // TEXT: { "markdown": string }
          // CODE: { "language": string, "code": string }
          // IMAGE_SUGGESTION: { "prompt": string, "reason": string }
        }
      }
    ]
  }
  
  # BLOCK STRUCTURE RULES (CRITICAL)
  
  1. **TEXT BLOCKS MUST NEVER BE CONSECUTIVE**
     - Consolidate all sequential text into ONE block
     - Use markdown headers (##, ###, ####) to organize sections within the block
     - Use \\n\\n to separate topics and paragraphs
     - TEXT blocks can only be interrupted by CODE or IMAGE_SUGGESTION blocks
  
  2. **CODE and IMAGE_SUGGESTION blocks CAN be consecutive**
     - Multiple code examples in sequence: ✅ Allowed
     - Multiple image suggestions in sequence: ✅ Allowed
  
  # MARKDOWN HIERARCHY IN TEXT BLOCKS
  - ## Main sections (Introduction, Core Concepts, Conclusion)
  - ### Subsections within main sections
  - #### Minor subsections if needed
  - Use **bold** for emphasis, *italic* for terms
  - Use bullet points and numbered lists for enumerations
  
  # MODIFICATION CAPABILITIES
  
  You have full autonomy to improve the lesson. You may:
  
  ## Content Modifications
  - **Edit** existing blocks (rewrite for clarity, fix errors, improve explanations)
  - **Add** new blocks (missing explanations, additional examples, code demonstrations)
  - **Remove** blocks (redundant, off-topic, or unnecessary content)
  - **Enhance** with better examples, analogies, or visual aids
  
  ## Structural Modifications
  - **Reorder** blocks (improve logical flow and pedagogical progression)
  - **Consolidate** multiple TEXT blocks into one (using markdown headers)
  - **Split** oversized blocks into logical, manageable sections
  - **Balance** content distribution (proper introduction → development → conclusion)
  
  ## Quality Standards
  - Maintain pedagogical coherence with smooth transitions between concepts
  - Preserve specialized terminology or manually added examples
  - Match the target audience's knowledge level and expectations
  - Keep tone consistent throughout the lesson
  - Use code blocks only when they genuinely enhance understanding
  - Limit image suggestions to 2-4 total for the entire lesson (only when beneficial)
  
  # BLOCK TYPE GUIDELINES
  
  ## TEXT blocks
  - Use for: Explanations, definitions, theory, context, summaries
  - Structure with markdown headers and proper formatting
  - Keep related content consolidated in one block
  
  ## CODE blocks
  - **No markdown fences** in the code field (no \`\`\`)
  - Include inline comments explaining key concepts
  - Provide complete, runnable examples when possible
  - Always specify the programming language clearly
  
  ## IMAGE_SUGGESTION blocks
  - Provide detailed DALL-E prompts including:
    * Subject matter and key visual elements
    * Style (e.g., "educational diagram, flat design, minimalist")
    * Color palette and composition
    * Educational purpose
  - Example: "Educational diagram showing the water cycle with labeled arrows, flat design style, blue and green color palette, clear Spanish labels, top-down perspective"
  - Include clear reason explaining the educational value
  
  # OUTPUT REQUIREMENTS
  - Valid JSON only (no preamble or explanations outside JSON)
  - No markdown fences around the JSON response
  - No HTML tags in content
  - Complete lesson with all blocks (both modified and unmodified)`,
    },
    {
      role: 'user',
      content: `Modify this lesson according to the instructions below.
  
  # CURRENT LESSON STATE
  ${JSON.stringify({ title: config.title, blocks: currentBlocks }, null, 2)}
  
  # LESSON CONFIGURATION (must be maintained)
  - Language: ${config.language}
  - Audience: ${config.audience}
  - Level: ${config.targetLevel}
  - Tone: ${config.tone}
  - Length: ${config.contentLength}
  - Learning Objectives: ${config.learningObjectives.join('; ')}${config.contextPrompt ? `\n- Module Context: ${config.contextPrompt}` : ''}
  
  # MODIFICATION INSTRUCTIONS
  ${instruction}
  
  # YOUR TASK
  Analyze the instruction carefully and make the necessary improvements. Use your autonomous judgment to:
  - Determine the appropriate scope of changes
  - Decide whether to add, edit, remove, or reorder blocks
  - Maintain high pedagogical quality and coherent structure
  - NEVER create consecutive TEXT blocks - consolidate them using markdown headers
  
  Return the COMPLETE updated lesson as a valid JSON object. Include all blocks (both modified and unmodified) in the final output.`,
    },
  ]
