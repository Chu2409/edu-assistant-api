# Tasks: intelligent-feedback-emails

## Phase 1: Foundation — Types, Interfaces, Constants

- [x] 1.1 Crear `src/shared/constants/queues.ts` — agregar `FEEDBACK_DIGEST` con `WEEKLY_DIGEST` job
- [x] 1.2 Crear `src/shared/constants/email-templates.ts` — agregar `TEACHER_FEEDBACK_DIGEST`
- [x] 1.3 Crear `src/features/feedback-analysis/interfaces/feedback-analysis-settings.interface.ts` — interface con todas las propiedades de threshold

## Phase 2: Core Services

- [x] 2.1 Crear `src/features/feedback-analysis/services/disengagement.service.ts` — detección de inactivos y estudiantes frustrados usando thresholds de SystemSetting
- [x] 2.2 Crear `src/features/feedback-analysis/services/problematic-content.service.ts` — detecta LOs con baja tasa de éxito y estudiantes en dificultad
- [x] 2.3 Crear `src/features/feedback-analysis/services/recommendation.service.ts` — motor de recomendaciones usando LearningObjectRelation y embeddings

## Phase 3: DTOs

- [x] 3.1 Crear `src/features/feedback-analysis/dtos/insight.dto.ts` — InsightDto con type, title, description, dataUsed, recommendation, affectedStudents, relatedContent
- [x] 3.2 Crear `src/features/feedback-analysis/dtos/feedback-digest.dto.ts` — FeedbackDigestDto con teacherName, moduleTitle, insights[], generatedAt

## Phase 4: Worker y Orquestación

- [x] 4.1 Crear `src/features/feedback-analysis/feedback-analysis.service.ts` — inyecta DBService, EmailService, DisengagementService, ProblematicContentService, RecommendationService. Método `buildDigest(moduleId)` que orquesta todo y retorna FeedbackDigestDto
- [x] 4.2 Crear `src/features/feedback-analysis/workers/feedback-digest.worker.ts` — extiende WorkerHost, procesa WEEKLY_DIGEST, itera módulos activos y llama a feedbackAnalysisService.processWeeklyDigests()

## Phase 5: Module y Worker Registration

- [x] 5.1 Crear `src/features/feedback-analysis/feedback-analysis.module.ts` — importa EmailModule, BullModule con queue FEEDBACK_DIGEST, providers: todos los services + worker, implements OnModuleInit con scheduler `0 9 * * 6`
- [x] 5.2 Modificar `src/worker.module.ts` — importar FeedbackAnalysisModule, agregar FeedbackDigestWorker a providers

## Phase 6: Email Template

- [x] 6.1 Crear `src/shared/templates/email/teacher-feedback-digest.ejs` — HTML con secciones: Early Warning, Problematic Content, Peer Learning Suggestions, Insights Summary. Cada insight incluye "Esto se recomienda porque [dataUsed]"
- [x] 6.2 Crear `src/shared/templates/email/layout.ejs` — verificar que existe (ya existía, no se necesitó crear)

## Phase 7: Controller (debug)

- [x] 7.1 Crear `src/features/feedback-analysis/feedback-analysis.controller.ts` — endpoints GET `/feedback-analysis/test/:moduleId` y `/feedback-analysis/process-all` para probar digest manualmente

## Implementation Order

1. Constants y interfaces (1.x) — sin dependencias
2. DTOs (3.x) — sin dependencias
3. Services (2.x) — dependen de interfaces y DTOs
4. Worker y Service (4.x) — dependen de services y DTOs
5. Module y Worker registration (5.x) — conecta todo
6. Template (6.x) — al final, independiente
7. Controller (7.x) — opcional, para debugging