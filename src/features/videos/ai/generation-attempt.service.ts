import { Injectable } from '@nestjs/common'
import { BlockType, Prisma } from 'src/core/database/generated/client'
import { DBService } from 'src/core/database/database.service'
import { GenerationResult } from './interfaces/generation-result.interface'

@Injectable()
export class GenerationAttemptService {
  constructor(private readonly dbService: DBService) {}

  async record(
    videoId: number,
    requestedTypes: BlockType[],
    generated: GenerationResult,
    processingTimeMs: number,
    audit?: {
      instruction?: string
      previousContent?: Record<string, Prisma.InputJsonValue>
    },
  ): Promise<void> {
    const completedTypes = requestedTypes.filter(
      (t) => !generated.errors.some((e) => e.type === t),
    )

    await this.dbService.videoGenerationAttempt.create({
      data: {
        videoId,
        provider: generated.provider ?? 'unknown',
        model: generated.model ?? 'unknown',
        requestedTypes,
        completedTypes,
        failedTypes:
          generated.errors.length > 0
            ? (generated.errors as unknown as Prisma.InputJsonValue)
            : undefined,
        tokensInput: generated.totalTokens.input,
        tokensOutput: generated.totalTokens.output,
        processingTimeMs,
        instruction: audit?.instruction,
        previousContent:
          audit?.previousContent &&
          Object.keys(audit.previousContent).length > 0
            ? audit.previousContent
            : undefined,
        completedAt: new Date(),
      },
    })
  }
}
