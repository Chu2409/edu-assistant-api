# Feedback Analysis Specification

## Purpose

Sistema de análisis de interacciones de estudiantes para generar insights accionables destinados a profesores, con explicabilidad ética en cada recomendación.

## ADDED Requirements

### Requirement: Disengagement Detection

El sistema DEBE detectar estudiantes en riesgo de desconexión usando thresholds simples configurables.

El sistema DEBERÍA usar los siguientes thresholds por defecto:
- **Inactivity threshold**: 5+ días sin actividad en módulo inscrito
- **Failed attempts threshold**: 3+ intentos fallidos consecutivos en una misma actividad

#### Scenario: Estudiante inactivo detectado

- GIVEN un estudiante está inscrito en un módulo y no tiene actividad (ActivityAttempt, Note, StudentQuestion) en los últimos 5 días
- WHEN el worker ejecuta el digest semanal
- THEN el sistema DEBE incluir al estudiante en la lista de "alerta de desconexión" del profesor

#### Scenario: Estudiante con intentos fallidos detectados

- GIVEN un estudiante tiene 3+ intentos fallidos en la misma actividad (isCorrect=false)
- WHEN el worker ejecuta el digest semanal
- THEN el sistema DEBE incluir al estudiante en la lista de "frustración" del profesor

#### Scenario: Estudiante activo no genera alerta

- GIVEN un estudiante tiene al menos una interacción en los últimos 4 días
- WHEN el worker ejecuta el digest semanal
- THEN el sistema NO DEBE incluir al estudiante en alertas

---

### Requirement: Problematic Content Detection

El sistema DEBE identificar contenidos (L Os) que causan dificultades a múltiples estudiantes.

#### Scenario: LO con múltiples estudiantes en dificultad

- GIVEN 3+ estudiantes tienen intentos fallidos en la misma actividad de una LO
- WHEN el worker ejecuta el digest semanal
- THEN el sistema DEBE marcar esa LO como "contenido problemático" y sugerir revisión

#### Scenario: LO con alta tasa de fracaso

- GIVEN una actividad tiene tasa de aprobación < 40% (fallos / total intentos > 0.6)
- WHEN el worker ejecuta el digest semanal
- THEN el sistema DEBE incluir la LO en "contenidos con baja tasa de éxito"

---

### Requirement: Peer Learning Suggestions

El sistema DEBERÍA sugerir collaborative learning cuando múltiples estudiantes muestran la misma dificultad.

#### Scenario: Misma pregunta de estudiantes diferentes

- GIVEN 2+ estudiantes preguntan sobre el mismo concepto ( LearningObjectConcept.term similar)
- WHEN el worker ejecuta el digest semanal
- THEN el sistema DEBERÍA sugerir crear un forum thread o discussion group

---

### Requirement: Content Recommendation Engine

El sistema DEBE usar vectores de embedding y relaciones de similitud existentes para recomendar L Os relacionados.

El sistema DEBERÍA recomendar L Os basados en:
- `LearningObjectRelation` con `similarityScore > 0.7`
- Relación tipo `PREREQUISITE` o `COMPLEMENTARY`
- Intersección de conceptos entre L Os que el estudiante ha completado vs. no

#### Scenario: Estudiante con LO difícil — recomendación de prerrequisito

- GIVEN un estudiante tiene dificultad (fallos) en LO-A
- WHEN se buscan recomendaciones
- THEN el sistema DEBE buscar L Os relacionados con LO-A tipo PREREQUISITE

#### Scenario: Recomendación basada en conceptos similares

- GIVEN un estudiante completó LO-A y LO-B con buenos resultados
- WHEN se buscan recomendaciones de profundización
- THEN el sistema DEBE buscar L Os con conceptos relacionados (LearningObjectConcept) no yet completed

---

### Requirement: Email Digest Explicability

El sistema DEBE incluir en cada email una sección "Esto se recomienda porque..." para TODO insight.

Cada insight DEBE especificar:
- **Qué datos se usaron**: ej. "basado en 4 intentos fallidos en la última semana"
- **Por qué se recomienda**: ej. "porque el concepto de 'respiración celular' es prerrequisito para 'metabolismo'"
- **Fuentes**: ej. "Datos de: ActivityAttempt, LearningObjectRelation, LearningObjectConcept"

#### Scenario: Email con threshold insuficiente

- GIVEN no hay suficientes datos para generar insights (mínimo 2 interacciones por estudiante)
- WHEN el worker evalúa si enviar email
- THEN el sistema NO DEBE enviar email al profesor (evitar spam)

---

### Requirement: Email Digest Generation

El sistema DEBE generar un email estructurado para profesores con las siguientes secciones:
1. **Early Warning**: estudiantes en riesgo de desconexión
2. **Problematic Content**: LOs que causan dificultades
3. **Peer Learning Suggestions**: recomendaciones de colaboración
4. **Insights Summary**: resumen ejecutivo

El sistema DEBERÍA incluir en cada sección:
- Lista de estudiantes afectados (anonimizada si hay < 3)
- Contenido específico relacionado
- Explicación del origen del insight

#### Scenario: Digest con insights suficientes

- GIVEN el sistema tiene al menos 1 insight accionable
- WHEN se ejecuta el worker de digest
- THEN el sistema DEBE enviar email al profesor del módulo
- AND el email DEBE contener todas las secciones requeridas

#### Scenario: Digest sin insights — no se envía email

- GIVEN el sistema no tiene insights accionables (threshold no alcanzado)
- WHEN se ejecuta el worker de digest
- THEN el sistema NO DEBE enviar email
- AND el sistema DEBERÍA registrar en logs que no hubo insights suficientes

---

## Constants (Configurables)

| Threshold | Default | Descripción |
|-----------|---------|-------------|
| INACTIVITY_DAYS | 5 | Días sin actividad para alerta de desconexión |
| FAILED_ATTEMPTS_CONSECUTIVE | 3 | Intentos fallidos consecutivos para alerta de frustración |
| MIN_STUDENTS_FOR_PROBLEMATIC_LO | 3 | Mínimo de estudiantes con dificultad para marcar LO como problemático |
| MIN_INTERACTIONS_FOR_INSIGHT | 2 | Mínimo de interacciones para generar insight |
| SIMILARITY_SCORE_THRESHOLD | 0.7 | Score mínimo para usar LearningObjectRelation en recomendaciones |