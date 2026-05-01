# Design: intelligent-feedback-emails

## Technical Approach

Sistema de digest semanal que analiza interacciones de estudiantes via un nuevo módulo `FeedbackAnalysisModule`, genera insights accionables y los envía por email a profesores usando la infraestructura de email existente. Los insights se generan en un worker semanal con BullMQ (patrón idéntico a `EnrollmentsWorker`).

## Architecture Decisions

### Decision: Nuevo módulo vs. extender módulo existente

**Choice**: Crear `src/features/feedback-analysis/` como módulo nuevo
**Alternatives considered**: Colocar la lógica dentro de `TeacherFeedbackModule` o `ModulesModule`
**Rationale**: La lógica de análisis es suficientemente distinta (analytics vs. generación de contenido) y tenerla aislada permite evolucionar independientemente. Además, sigue el patrón del codebase donde cada "dominio" tiene su propio módulo.

### Decision: Thresholds configurables por módulo via SystemSetting

**Choice**: Guardar thresholds en `SystemSetting` para permitir configuración por módulo
**Alternatives considered**: Constants globales en código
**Rationale**: Cada módulo puede tener diferentes niveles de engagement. Un módulo universitario vs. uno de high school puede requerir thresholds distintos. Usar `SystemSetting` permite cambiar sin redeploy. Se guarda con prefijo `FEEDBACK_ANALYSIS_`.

### Decision: Un solo worker semanal vs. múltiples jobs

**Choice**: Un solo worker `FeedbackDigestWorker` con un job `WEEKLY_DIGEST`
**Alternatives considered**: Jobs separados para cada tipo de insight (disengagement, problematic-content, etc.)
**Rationale**: Un solo email agregadogarantiza que el profesor recibe un digest cohesivo en vez de múltiples emails fragmentados. El tradeoff es que si una parte falla, falla todo — pero todas las partes leen de DB así que no hay dependencias externas.

### Decision: No crear modelo de email log en schema

**Choice**: No agregar `FeedbackEmailLog` ni otro modelo nuevo
**Alternatives considered**: Crear tabla para tracking de envíos
**Rationale**: No hay requerimiento de tracking ni retry por ahora. Si el email falla, se logged pero no se reintenta. En fase 2 (estudiantes) o si hay requerimiento de compliance, se agrega.

### Decision: Anonimizar estudiantes cuando hay < 3 afectados

**Choice**: Cuando un insight afecta a menos de 3 estudiantes, no se muestran nombres individuales
**Alternatives considered**: Mostrar siempre todos los nombres
**Rationale**: Privacy concern. Cuando hay < 3 estudiantes afectados, identificarlos es demasiado fácil. Se muestra solo "X estudiantes afectados" sin detalles.

### Decision: Schedule igual al teacher feedback semanal

**Choice**: `0 9 * * 6` — mismo schedule que TeacherFeedback (sábados 9 AM)
**Alternatives considered**: Otro día/hora específico
**Rationale**: El equipo ya tiene ese schedule para el feedback de IA. Mantener consistencia reduces confusion.

## Data Flow

```
[WorkerModule] ---(weekly trigger)---> [FeedbackDigestWorker]
                                            │
                              ┌─────────────┴─────────────┐
                              │                             │
                    [FeedbackAnalyticsService]    [EmailService]
                              │                             │
                 ┌────────────┴────────────┐                │
                 │                         │                │
        [DisengagementService]   [ProblematicContentService]
                 │                         │
                 └────────────┬────────────┘
                              │
                    [ContentRecommendationService]
                              │
                              └──────────┐
                                         │
                              [FeedbackDigest] (DTO)
                                         │
                              [EmailService.sendWithTemplate]
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/features/feedback-analysis/` | Create | Carpeta del módulo completo |
| `src/features/feedback-analysis/feedback-analysis.module.ts` | Create | Módulo NestJS con OnModuleInit para scheduler |
| `src/features/feedback-analysis/feedback-analysis.controller.ts` | Create | Endpoints de debug/management (opcional, deshabilitado en prod) |
| `src/features/feedback-analysis/feedback-analysis.service.ts` | Create | Orquestación: obtiene thresholds de SystemSetting, orquesta servicios, envía email |
| `src/features/feedback-analysis/services/disengagement.service.ts` | Create | Detección de inactivos/frustrados |
| `src/features/feedback-analysis/services/problematic-content.service.ts` | Create | Detección de LOs problemáticos |
| `src/features/feedback-analysis/services/recommendation.service.ts` | Create | Motor de recomendaciones con embeddings |
| `src/features/feedback-analysis/dtos/feedback-digest.dto.ts` | Create | DTO para datos del email |
| `src/features/feedback-analysis/dtos/insight.dto.ts` | Create | DTO para insights individuales |
| `src/features/feedback-analysis/workers/feedback-digest.worker.ts` | Create | WorkerHost con job WEEKLY_DIGEST |
| `src/features/feedback-analysis/interfaces/feedback-analysis-settings.interface.ts` | Create | Interface para thresholds de SystemSetting |
| `src/shared/constants/queues.ts` | Modify | Agregar `FEEDBACK_DIGEST` a QUEUE_NAMES |
| `src/shared/templates/email/teacher-feedback-digest.ejs` | Create | Template de email para digest con sección "por qué" |
| `src/shared/constants/email-templates.ts` | Modify | Agregar `TEACHER_FEEDBACK_DIGEST` |
| `src/worker.module.ts` | Modify | Agregar `FeedbackAnalysisModule` import y `FeedbackDigestWorker` provider (worker-only, no AppModule) |

## Interfaces / Contracts

### FeedbackDigestDto
```typescript
export interface Insight {
  type: 'disengagement' | 'problematic_content' | 'peer_learning' | 'low_success_rate'
  title: string
  description: string
  dataUsed: string           // ej: "basado en 4 intentos fallidos"
  recommendation: string     // ej: "recomendamos que el estudiante revise X"
  affectedStudents: { id: number; name: string }[]
  relatedContent?: { id: number; title: string }[]
}

export interface FeedbackDigestDto {
  teacherName: string
  moduleTitle: string
  insights: Insight[]
  generatedAt: Date
}
```

### Disengagement Thresholds (SystemSetting keys)

Los thresholds se leen de `SystemSetting` por módulo. Keys con prefijo `FEEDBACK_ANALYSIS_`:

| SystemSetting Key | Default | Descripción |
|------------------|---------|-------------|
| `FEEDBACK_ANALYSIS_INACTIVITY_DAYS` | 5 | Días sin actividad para alerta |
| `FEEDBACK_ANALYSIS_FAILED_ATTEMPTS` | 3 | Intentos fallidos para frustración |
| `FEEDBACK_ANALYSIS_MIN_STUDENTS` | 3 | Mínimo de estudiantes para LO problemático |
| `FEEDBACK_ANALYSIS_MIN_INTERACTIONS` | 2 | Mínimo de interacciones para generar insight |
| `FEEDBACK_ANALYSIS_SIMILARITY_THRESHOLD` | 0.7 | Score mínimo para relaciones de similitud |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | DisengagementService: logic de thresholds | Test directo con mocks de Prisma |
| Unit | RecommendationService: búsqueda de LOs relacionados | Test con embedding simulado |
| Unit | FeedbackDigestWorker: job processing | Test de process() directo |
| Integration | Worker completo: email se envía | Integration test con queue de test |

**Nota**: El proyecto no tiene test runner configurado actualmente. Testing es aspiracional para fase 2.

## Migration / Rollback

- **Feature flag**: No se necesita — es worker standalone
- **Rollback**: Eliminar módulo + eliminar worker de `WorkerModule` + quitar imports de `AppModule`
- **Data migration**: Ninguna

## Open Questions

- [x] ¿Los thresholds deben ser configurables por módulo (SystemSetting) o globales (const)? → **SystemSetting por módulo**
- [x] ¿Se requiere tracking de emails enviados (email log)? → **No por ahora, se puede agregar en fase 2**
- [x] ¿Los estudiantes afectados se anonimizan cuando hay < 3? → **Sí**
- [x] ¿Frecuencia del email: semanal exacto (día específico) o configurable? → **Mismo schedule que teacher feedback: `0 9 * * 6` (sábados 9 AM)**