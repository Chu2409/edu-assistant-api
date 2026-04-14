---
name: Project Architecture
description: NestJS structure, patterns, and conventions for this edu-assistant-api
type: project
---

## NestJS Structure

**Location:** `/Users/sebastiancamino/workspace/Titulation_Project/edu-assistant-api/`

### Key directories:
- `src/features/` — Feature modules (e.g., videos, interactions, auth)
- `src/core/` — Core services (database, config)
- `src/shared/` — Shared utilities (exceptions, mappers)

### Current Videos Module:
- `src/features/videos/videos.module.ts` — Empty Module() export

### Database & Config:
- **Prisma Client:** `src/core/database/generated/client.ts` (auto-generated)
- **Enums:** `src/core/database/generated/enums.ts` (auto-generated)
- **Config Interface:** `src/core/config/types/index.ts` exports IConfig
- **Config Service:** Uses CustomConfigService which wraps NestJS ConfigService
  - Access pattern: `this.customConfigService.env.WHISPER_MODEL`
  - NOT: `this.configService.get<string>('APP.WHISPER_MODEL')`

### Exception Pattern:
- BusinessException at `src/shared/exceptions/business.exception.ts`
- Constructor: `constructor(message: string | string[], statusCode: number)`

### Service Pattern:
- `@Injectable()` decorator
- Constructor injection of dependencies
- Methods: async, return DTOs via mappers

## Code Style Rules (from CLAUDE.md)
- No comments (use clear code instead)
- No `any` types — always use specific types
- One concept per file
- Constants in dedicated constants files (e.g., `src/constants/sorting.constants.ts`)
