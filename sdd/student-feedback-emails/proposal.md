# Proposal: student-feedback-emails

## Intent

Sistema de emails semanales personalizados para **estudiantes** con feedback sobre su progreso, recomendaciones de contenido y estrategias de estudio. Solo se envía cuando hay insights relevantes (no spam). Días distintos a profesores para cumplir límite de 10k emails/día.

## Scope

### In Scope
- Email semanal para estudiantes (solo si hay insights nuevos)
- Día de envío: **domingo 9 AM** (distinto a profesores que es sábado)
- Recomendaciones personalizadas de LOs basadas en embedding/relaciones
- Estrategias de estudio ("Try tracing the code step by step")
- Explicabilidad: cada recomendación incluye "por qué se recomienda esto"
- No enviar si no hay actividad nueva esa semana

### Out of Scope
- Sistema de gamificación o badges
- Notificaciones push (solo email)
- Detección de emociones avanzada (ML) — thresholds simples nomás

## Capabilities

### New Capabilities
- `student-feedback-analysis`: módulo que analiza actividad individual del estudiante y genera recommendations
- `student-email-digest`: template y lógica de envío para estudiantes
- `insights-trigger`: solo encola email si hay insights >= threshold

### Modified Capabilities
- `FeedbackAnalysisModule`: extiende worker para día domingo + check de insights por estudiante

## Approach

1. **Nuevo servicio**: `StudentFeedbackService` — analiza actividad del estudiante individual
2. **Thresholds por estudiante**: no requiere SystemSetting, usa defaults hardcodeados
3. **Worker separado**: `STUDENT_FEEDBACK_DIGEST` queue, schedule domingo 9 AM
4. **Condición de envío**: solo si `studentInsights.length >= 1` (al menos 1 recomendación)
5. **Template**: `student-feedback-digest.ejs` con contenido personalizado para estudiantes

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/features/feedback-analysis/services/student-feedback.service.ts` | Create | Lógica de recomendaciones por estudiante |
| `src/features/feedback-analysis/workers/student-feedback.worker.ts` | Create | Worker domingo 9 AM |
| `src/features/feedback-analysis/feedback-analysis.module.ts` | Modified | Agregar StudentFeedbackService + worker |
| `src/shared/constants/queues.ts` | Modified | Agregar STUDENT_FEEDBACK_DIGEST |
| `src/shared/templates/email/student-feedback-digest.ejs` | Create | Template para estudiantes |
| `src/shared/constants/email-templates.ts` | Modified | Agregar STUDENT_FEEDBACK_DIGEST |

## Email Content Structure (Student)

1. **Tu progreso esta semana** — résumé rápido
2. **LOs recomendados** — basados en dificultades o conceptos relacionados
3. **Estrategias de estudio** — tips personalizados
4. **Explicabilidad** — "Esto se recomienda porque X, basado en Y"

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Límite 10k emails/día | Low | Solo se envía a estudiantes con insights nuevos + día distinto |
| Email vacío si no hay actividad | Low | Condición de envío: solo si hay insights |

## Rollback Plan

1. Deshabilitar worker en `FeedbackAnalysisModule.onModuleInit()`
2. Eliminar `StudentFeedbackService` y `student-feedback.worker.ts`
3. Limpiar constants y templates

## Dependencies

- `RecommendationService` existente (reutilizado)
- `LearningObjectRelation` y `LearningObjectConcept` existentes
- Email infrastructure existente

## Success Criteria

- [ ] Estudiante recibe email solo si tiene recomendaciones nuevas
- [ ] Email incluye sección "por qué se recomienda esto"
- [ ] Worker corre domingo 9 AM (no sábado)
- [ ] No se superan los 10k emails/día (solo envía a estudiantes activos con insights)