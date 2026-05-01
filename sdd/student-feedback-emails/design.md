# Design: student-feedback-emails

## Technical Approach

Sistema de digest semanal para estudiantes que analiza actividad individual y envía email solo si hay insights relevantes. Schedule domingo 9 AM para evitar competencia con profesores. Reutiliza `RecommendationService` existente y crea `StudentFeedbackService` nuevo.

## Architecture Decisions

### Decision: Worker separado vs. same worker con conditional

**Choice**: Worker separado `STUDENT_FEEDBACK_DIGEST` con schedule domingo
**Alternatives considered**: Un solo worker con condiciones de día
**Rationale**: Permite deshabilitar estudiantes sin tocar el schedule de profesores. Más granular control.

### Decision: Solo enviar si hay insights >= 1

**Choice**: `MIN_INSIGHTS_FOR_EMAIL = 1` (hardcoded default)
**Alternatives considered**: Configurable vía SystemSetting
**Rationale**: Simplifica la lógica. Un solo insight ya es suficiente para justificar el email.

### Decision: Reutilizar RecommendationService existente

**Choice**: `StudentFeedbackService` usa `RecommendationService` internamente
**Alternatives considered**: Duplicar lógica
**Rationale**: DRY. El motor de recomendación ya existe, solo se necesita orchestrar análisis por estudiante.

## Data Flow

```
[WorkerModule] ---(domingo 9AM)---> [StudentFeedbackWorker]
                                            │
                              [StudentFeedbackService]
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    │                                               │
         [RecommendationService]                          [DBService]
                    │                                               │
         ┌──────────┴──────────┐                                    │
         │                     │                                    │
[FailedActivities]    [CompletedLos]                              │
         │                     │                                    │
         └──────────┬──────────┘                                    │
                    │                                               │
         [StudentInsight + StudyStrategy]                           │
                    │                                               │
         [EmailService.sendWithTemplate] ──> student-feedback-digest.ejs
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/features/feedback-analysis/services/student-feedback.service.ts` | Create | Análisis por estudiante, genera StudentInsight[] |
| `src/features/feedback-analysis/workers/student-feedback.worker.ts` | Create | WorkerHost, procesa STUDENT_WEEKLY_DIGEST |
| `src/features/feedback-analysis/feedback-analysis.module.ts` | Modify | Agregar StudentFeedbackService + worker |
| `src/shared/constants/queues.ts` | Modify | Agregar STUDENT_FEEDBACK_DIGEST |
| `src/shared/templates/email/student-feedback-digest.ejs` | Create | Template para estudiantes |
| `src/shared/constants/email-templates.ts` | Modify | Agregar STUDENT_FEEDBACK_DIGEST |

## Interfaces / Contracts

### StudentInsight
```typescript
export interface StudentInsight {
  type: 'recommendation' | 'strategy' | 'progress'
  title: string
  description: string
  dataUsed: string
  recommendation: string
  relatedLoId?: number
  relatedLoTitle?: string
  studyStrategy?: string
}

export interface StudentDigest {
  studentName: string
  moduleTitle: string
  moduleId: number
  insights: StudentInsight[]
  generatedAt: Date
}
```

## Study Strategies (Constants)

```typescript
export const STUDY_STRATEGIES = {
  CODE: 'Try tracing the code step by step',
  CONCEPT: 'Explain the concept in your own words before coding',
  VOCABULARY: 'Review the glossary for key terms',
  PRACTICE: 'Practice the activity with a timer to track your speed',
} as const
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | StudentFeedbackService: logic de insights | Test directo con mocks de Prisma |
| Integration | Worker completo: emails se envían solo con insights | Integration test |

## Migration / Rollback

- **Feature flag**: No se necesita
- **Rollback**: Deshabilitar worker + eliminar servicio
- **Data migration**: Ninguna

## Open Questions

Ninguna — todas respondidas en el proposal.