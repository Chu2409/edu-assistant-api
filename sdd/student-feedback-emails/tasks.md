# Tasks: student-feedback-emails

## Phase 1: Infrastructure

- [x] 1.1 Modificar `src/shared/constants/queues.ts` — agregar `STUDENT_FEEDBACK_DIGEST` con `WEEKLY_DIGEST` job
- [x] 1.2 Modificar `src/shared/constants/email-templates.ts` — agregar `STUDENT_FEEDBACK_DIGEST`

## Phase 2: Student Feedback Service

- [x] 2.1 Crear `src/features/feedback-analysis/services/student-feedback.service.ts` — analiza actividad por estudiante, usa RecommendationService, genera StudentInsight[]
- [x] 2.2 Crear `src/features/feedback-analysis/constants/study-strategies.constant.ts` — STUDY_STRATEGIES con CODE, CONCEPT, VOCABULARY, PRACTICE
- [x] 2.3 Crear `src/features/feedback-analysis/dtos/student-insight.dto.ts` — StudentInsightDto y StudentDigestDto

## Phase 3: Worker

- [x] 3.1 Crear `src/features/feedback-analysis/workers/student-feedback.worker.ts` — extiende WorkerHost, procesa STUDENT_WEEKLY_DIGEST, itera estudiantes con enrollments activos

## Phase 4: Module Integration

- [x] 4.1 Modificar `src/features/feedback-analysis/feedback-analysis.module.ts` — importar StudentFeedbackService + worker, schedule domingo 9 AM

## Phase 5: Email Template

- [x] 5.1 Crear `src/shared/templates/email/student-feedback-digest.ejs` — template personalizado para estudiantes con secciones: progreso, recomendaciones, estrategias, explicabilidad

## Phase 6: Controller (opcional)

- [x] 6.1 Agregar endpoint GET `/feedback-analysis/test-student/:studentId` para probar digest de estudiante individual

## Implementation Order

1. Constants (1.x) — sin dependencias
2. DTOs (2.3) — sin dependencias
3. Service + Strategies (2.1, 2.2) — dependen de DTOs
4. Worker (3.1) — depende de service
5. Module (4.1) — conecta todo
6. Template (5.1) — al final
7. Controller (6.1) — opcional