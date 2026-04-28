# Skill Registry (edu-assistant-api)

## Project Standards (auto-resolved)

- **Language**: TypeScript
- **Framework**: NestJS (follow module-controller-service pattern)
- **Database**: Prisma ORM (schema-first)
- **Linting**: ESLint, Prettier
- **Testing**: Not configured (no test runner found in package.json)
- **Concurrency**: BullMQ
- **AI**: OpenAI integration
- **Naming Convention**: 
  - Controllers: `.controller.ts`
  - Services: `.service.ts`
  - Modules: `.module.ts`
  - DTOs: `.dto.ts`
  - Mappers: `.mapper.ts`
  - Interfaces: `.interface.ts`
- **Architecture**: Domain-driven approach with modules under `src/features/`.
- **Refactoring Convention**: Semantic shift from `page` to `learning_object` (except `page-content` in `content-generation`).
- **Communication**: Document all interface and route changes for the frontend team.

## User Skills

- **sdd-***: Standard SDD workflow skills.
- **go-testing**: (Not applicable, this is a Node.js project)
- **skill-creator**: For creating new AI skills.
- **judgment-day**: For adversarial reviews.
- **issue-creation**: For GitHub issues.
- **branch-pr**: For PR creation.
