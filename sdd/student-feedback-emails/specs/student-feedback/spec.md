# Student Feedback Email Specification

## Purpose

Sistema de emails semanales personalizados para estudiantes con feedback sobre su progreso, recomendaciones de contenido y estrategias de estudio. Solo se envía cuando hay insights relevantes, los días domingo para evitar competencia con emails de profesores.

## ADDED Requirements

### Requirement: Student Email Digest

El sistema DEBE generar un email personalizado para cada estudiante con insights relevantes.

El sistema DEBE incluir las siguientes secciones:
1. **Tu progreso esta semana** — resumen de actividad
2. **LOs recomendados** — basados en dificultades o conceptos relacionados
3. **Estrategias de estudio** — tips personalizados
4. **Explicabilidad** — "Esto se recomienda porque X, basado en Y"

El sistema DEBE especificar en cada recomendación:
- **Datos usados**: ej. "basado en tus intentos fallidos en la actividad X"
- **Por qué se recomienda**: ej. "porque el concepto de 'respiración celular' es prerrequisito para 'metabolismo'"

#### Scenario: Estudiante con insights suficientes — se envía email

- GIVEN un estudiante tiene al menos 1 insight (actividad fallida, concepto difícil, LO recomendado)
- WHEN el worker ejecuta el digest de estudiantes
- THEN el sistema DEBE enviar email al estudiante
- AND el email DEBE contener todas las secciones requeridas

#### Scenario: Estudiante sin insights — no se envía email

- GIVEN un estudiante no tuvo actividad nueva en la última semana
- WHEN el worker ejecuta el digest de estudiantes
- THEN el sistema NO DEBE enviar email al estudiante

---

### Requirement: Content Recommendation for Students

El sistema DEBE usar los embeddings y relaciones existentes para recomendar LOs al estudiante.

El sistema DEBERÍA recomendar LOs basados en:
- `LearningObjectRelation` con `similarityScore > 0.7`
- Relación tipo `PREREQUISITE` o `COMPLEMENTARY` de LOs donde el estudiante tuvo dificultades
- Intersección de conceptos entre LOs completados y no completados

El sistema DEBERÍA incluir estrategias como:
- "Try tracing the code step by step"
- "Explain the concept in your own words before coding"
- "Review the glossary for key terms"

#### Scenario: Estudiante con LO difícil — recomendación de prerrequisito

- GIVEN un estudiante tiene dificultades (fallos) en LO-A
- WHEN se buscan recomendaciones
- THEN el sistema DEBE buscar LOs relacionados con LO-A tipo PREREQUISITE
- AND DEBE incluir estrategia de estudio sugerida

#### Scenario: Estudiante con conceptos difíciles — recomendación por conceptos

- GIVEN un estudiante completó LO-A con dificultades (60%+ fallos)
- WHEN se buscan recomendaciones
- THEN el sistema DEBE buscar LOs que compartan conceptos con LO-A no yet completed

---

### Requirement: Study Strategies

El sistema DEBE incluir estrategias de estudio personalizadas basadas en el tipo de dificultad del estudiante.

El sistema DEBERÍA sugerir:
- Para código: "Try tracing the code step by step"
- Para conceptos: "Explain the concept in your own words before coding"
- Para vocabulario: "Review the glossary for key terms"

#### Scenario: Estudiante con intentos fallidos en actividad de código

- GIVEN un estudiante tiene múltiples intentos fallidos en una actividad tipo CODE
- WHEN se genera la recomendación
- THEN el sistema DEBE sugerir "Try tracing the code step by step"

---

## Thresholds (Defaults — no configurables por ahora)

| Threshold | Default | Descripción |
|-----------|---------|-------------|
| MIN_INSIGHTS_FOR_EMAIL | 1 | Mínimo de insights para enviar email |
| SIMILARITY_SCORE_THRESHOLD | 0.7 | Score mínimo para LearningObjectRelation |