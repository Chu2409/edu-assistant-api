# Proposal: intelligent-feedback-emails

## Intent

Sistema de emails semanales de feedback inteligente: (1) PARA PROFESORES — alertas de desconexión, sugerencias de contenido problemático y peer learning cuando múltiples estudiantes muestran problemas similares; (2) PARA ESTUDIANTES — rutas de aprendizaje personalizadas, recomendaciones de LOs, estrategias de estudio. Basado en datos de interacciones existentes en BDD. Requiere transparencia ética: cada recomendación debe explicar POR QUÉ y EN QUÉ se basa.

## Scope

### In Scope
- Email semanal para PROFESORES con:
  - Detección de desconexión/frustración (thresholds simples: X intentos fallidos, Y días inactivo)
  - Detección de contenido problemático (múltiples estudiantes con misma LO difícil)
  - Sugerencias de peer learning (forum threads, collaborative problem-solving)
  - Identificación de LOs con baja tasa de éxito
- Motor de recomendaciones de LOs usando `embedding` vector y `LearningObjectRelation.similarityScore`
- Explicabilidad: cada email incluye sección "Esto se recomienda porque X, basado en Y interacciones"
- Worker semanal con BullMQ (extender infraestructura existente)
- Ethics framework baked-in desde el inicio

### Out of Scope
- Email para estudiantes (fase 2, post-profesores)
- Detección de anomalías compleja (ML/IA) — thresholds simples nomás
- Sistema de recomposición automática de contenido

## Capabilities

### New Capabilities
- `feedback-analysis`: módulo que agrega datos de estudiantes y genera insights accionables
- `disengagement-detection`: detecta cuando un estudiante está en riesgo (thresholds configurables)
- `content-recommendation`: usa vectores y relaciones existentes para recomendar LOs relacionados
- `email-feedback-digest`: email estructurado con secciones de insight y justificación

### Modified Capabilities
- Ninguna (es feature nuevo)

## Approach

1. **Nuevo módulo**: `src/features/feedback-analysis/` (analytics service + disengagement service)
2. **Extender worker**: job semanal en `src/worker.module.ts`
3. **Umbrales simples configurables** en constants (ej: 3+ intentos fallidos = alerta, 5+ días sin actividad = desconexión)
4. **Email service existente** extiende con nuevos templates que incluyen sección de explicabilidad
5. **No se toca el schema** — todos los datos ya existen en las tablas existentes

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/features/feedback-analysis/` | New | Módulo nuevo con analytics, alerts, recommendation services |
| `src/providers/email/` | Modified | Nuevos templates de email con sección de justificación |
| `src/worker.module.ts` | Modified | Agregar job semanal de digest |
| `src/shared/constants/` | New | Thresholds configurables (disengagement, alert windows) |
| `prisma/schema.prisma` | Modified (optional) | Puede necesitar `FeedbackEmailLog` para tracking de envíos |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Email spam a profesores | Medium | Solo enviar si hay insights accionables (no empty emails) |
| Privacy concerns | Medium | Explicitar qué datos se usan en cada email |
| Falsos positivos en alerts | Medium | Thresholds conservatives + mínimo de evidencia requerida |

## Rollback Plan

1. Deshabilitar worker job via feature flag en `SystemSetting`
2. Eliminar módulo `feedback-analysis/` completo
3. Revertir templates de email a versión anterior
4. No hay migración de schema necesaria si no se agregó modelo nuevo

## Dependencies

- Infraestructura de email existente (`src/providers/email/`)
- Vectores de embeddings (`LearningObject.embedding`) y relaciones de similitud (`LearningObjectRelation.similarityScore`)
- BullMQ worker infrastructure existente
- Datos existentes: `ActivityAttempt`, `LearningObjectFeedback`, `StudentQuestion`, `Note`, `Enrollment`

## Success Criteria

- [ ] Profesor recibe email semanal con al menos 1 insight accionable
- [ ] Cada recomendación en email incluye sección "por qué se recomienda esto"
- [ ] Desconexión detectada cuando estudiante pasa X días sin actividad en módulo inscrito
- [ ] Email solo se envía si hay datos suficientes (threshold mínimo de interacciones)
- [ ] Worker corre correctamente en entorno local con fake queue