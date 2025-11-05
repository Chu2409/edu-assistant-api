# Documentación de Base de Datos - Sistema Educativo con IA

## Índice

1. [Usuarios y Autenticación](#usuarios-y-autenticación)
2. [Módulos (Cursos)](#módulos-cursos)
3. [Lecciones y Contenidos](#lecciones-y-contenidos)
4. [Conceptos y Relaciones](#conceptos-y-relaciones)
5. [Actividades y Evaluaciones](#actividades-y-evaluaciones)
6. [Contenido Generado por IA](#contenido-generado-por-ia)
7. [Progreso y Tracking](#progreso-y-tracking)
8. [Interacción Estudiante-Docente](#interacción-estudiante-docente)
9. [Notificaciones](#notificaciones)
10. [Recursos Multimedia](#recursos-multimedia)
11. [Optimización y Jobs](#optimización-y-jobs)

---

## Usuarios y Autenticación

### **User**

**Propósito**: Gestiona todos los usuarios del sistema con autenticación propia.

**Funciones principales:**

- Almacena credenciales y datos básicos de usuarios
- Soporta múltiples roles: ADMIN, TEACHER, STUDENT
- Un usuario puede ser docente en algunos módulos y estudiante en otros
- Control de estado activo/inactivo

**Campos importantes:**

- `role`: Define los permisos del usuario
- `isActive`: Permite desactivar usuarios sin eliminarlos

**Relaciones:**

- Como docente: puede crear y gestionar múltiples módulos
- Como estudiante: puede enrolarse en múltiples módulos
- Genera contenido con IA, responde actividades, hace preguntas

**Casos de uso:**

- Registro e inicio de sesión
- Cambio de contraseña
- Un profesor puede estar enrolado como estudiante en otro módulo

---

## Módulos (Cursos)

### **Module**

**Propósito**: Representa un curso completo creado por un docente.

**Funciones principales:**

- Contenedor principal de todo el contenido educativo
- Control de enrolamiento de estudiantes (RF-1, RF-1a, RF-1b)
- Generación de URL pública para integración con Moodle (RF-2a)
- Configuración centralizada de IA

**Campos importantes:**

- `allowSelfEnroll`: Controla si estudiantes pueden enrolarse libremente (RF-1b)
- `isPublic`: Define si el módulo es visible públicamente
- `publicUrl`: URL única para acceso externo desde Moodle

**Relaciones:**

- Tiene un solo docente propietario
- Contiene múltiples lecciones ordenadas
- Puede tener múltiples estudiantes enrolados
- Tiene conceptos identificados a nivel de módulo
- Configuración de IA específica

**Casos de uso:**

- Docente crea un nuevo curso de "Programación OOP"
- Estudiantes se enrolan libremente o por invitación del docente
- Integración manual con Moodle usando publicUrl

---

### **AiConfiguration**

**Propósito**: Configura cómo la IA se comporta específicamente para cada módulo (RF-9, RF-10).

**Funciones principales:**

- Define el idioma de generación de contenido (RF-9)
- Establece el contexto educativo del módulo (RF-10)
- Controla parámetros de creatividad y longitud de respuestas

**Campos importantes:**

- `language`: Idioma del contenido ("es", "en", "fr", etc.)
- `contextPrompt`: Instrucciones específicas para la IA sobre cómo comportarse en este módulo
- `temperature`: Controla creatividad (0.1-1.0)
- `maxTokens`: Límite de longitud de respuestas

**Casos de uso:**

- Módulo de inglés: `language="en"` para generar todo en inglés
- Módulo técnico: `temperature=0.3` para respuestas precisas
- Módulo de literatura: `temperature=0.9` para respuestas más creativas
- `contextPrompt` personalizado: "Eres un asistente de matemáticas que usa LaTeX..."

---

### **Enrollment**

**Propósito**: Registra la inscripción de estudiantes en módulos (RF-1).

**Funciones principales:**

- Relaciona estudiantes con módulos
- Rastrea fecha de enrolamiento y finalización
- Control de estado activo (permite pausar/reactivar)

**Campos importantes:**

- `enrolledAt`: Cuándo se inscribió el estudiante
- `completedAt`: Cuándo completó el módulo (si aplica)
- `isActive`: Permite desactivar temporalmente sin eliminar

**Casos de uso:**

- Estudiante se enrola en "Introducción a Python"
- Docente enrola manualmente a su lista de clase (RF-1a)
- Sistema marca como completado cuando termina todas las lecciones

---

## Lecciones y Contenidos

### **Lesson**

**Propósito**: Representa una lección individual dentro de un módulo.

**Funciones principales:**

- Contiene el contenido educativo principal
- Almacena embedding vectorial para identificar contenidos relacionados (RF-6)
- Mantiene orden secuencial dentro del módulo
- Puede tener múltiples actividades/reactivos asociados

**Campos importantes:**

- `content`: Contenido completo de la lección en texto
- `embedding`: Vector de 1536 dimensiones para similitud semántica
- `orderIndex`: Posición en el módulo
- `isPublished`: Control de visibilidad (borrador vs publicado)

**Relaciones:**

- Pertenece a un módulo
- Tiene múltiples actividades/evaluaciones
- Relacionada con otras lecciones (contenidos relacionados)
- Menciona múltiples conceptos del módulo
- Puede tener contenido generado por IA asociado
- Tiene recursos multimedia (videos, imágenes, podcasts)

**Casos de uso:**

- Docente crea lección "Introducción a la Herencia"
- Sistema genera embedding automáticamente
- Se calcula similitud con otras lecciones del módulo
- Estudiante ve lecciones relacionadas al final

---

### **LessonRelation**

**Propósito**: Almacena relaciones semánticas entre lecciones del mismo módulo (RF-6).

**Funciones principales:**

- Identifica contenidos relacionados automáticamente usando embeddings
- Clasifica el tipo de relación educativa
- Almacena temas comunes entre lecciones
- Proporciona explicación de por qué están relacionadas

**Campos importantes:**

- `similarityScore`: Similitud semántica calculada (0-1)
- `relationType`: Tipo de relación (SEMANTIC, PREREQUISITE, COMPLEMENTARY, etc.)
- `commonThemes`: Array de temas compartidos
- `explanation`: Texto explicativo de la relación

**Tipos de relación:**

- `SEMANTIC`: Similitud semántica general
- `PREREQUISITE`: La lección relacionada es prerequisito recomendado
- `COMPLEMENTARY`: Contenido complementario
- `DEEPENING`: Profundización del tema actual
- `APPLIED_EXAMPLE`: Ejemplo aplicado del tema

**Casos de uso:**

- Sistema calcula que "Herencia" y "Polimorfismo" tienen similitud 0.92
- Clasifica la relación como PREREQUISITE
- Estudiante en lección de "Polimorfismo" ve sugerencia: "Recomendado: revisar primero Herencia"

---

## Conceptos y Relaciones

### **ModuleConcept**

**Propósito**: Almacena conceptos clave identificados a nivel de módulo completo (RF-7).

**Funciones principales:**

- Identifica conceptos importantes que se repiten en el módulo
- Calcula importancia basada en frecuencia y relevancia
- Genera embedding para encontrar conceptos relacionados
- Clasifica conceptos por tipo educativo

**Campos importantes:**

- `name`: Nombre del concepto (ej: "Polimorfismo", "Variables")
- `definition`: Definición generada por IA
- `embedding`: Vector para similitud entre conceptos
- `importance`: Score 0-100 calculado
- `frequency`: Número de veces que aparece
- `conceptType`: FUNDAMENTAL, ADVANCED, o APPLIED

**Cálculo de importancia:**

```
importancia = (
  frecuencia_apariciones * 0.3 +
  suma(relevancia_en_cada_leccion) * 0.4 +
  es_mencionado_en_primera_leccion * 0.2 +
  cantidad_lecciones_donde_aparece / total_lecciones * 0.1
) * 100
```

**Casos de uso:**

- IA extrae "Herencia" de 8 lecciones del módulo
- Sistema calcula importancia: 85/100 (concepto fundamental)
- Estudiante ve mapa conceptual del módulo con conceptos ordenados por importancia

---

### **ConceptLesson**

**Propósito**: Relaciona conceptos con las lecciones donde aparecen (RF-7).

**Funciones principales:**

- Vincula cada concepto con las lecciones específicas donde se menciona
- Registra qué tan relevante es el concepto en cada lección
- Marca la primera vez que se introduce un concepto
- Almacena fragmento de texto donde aparece

**Campos importantes:**

- `relevance`: Qué tan central es el concepto en esta lección (0-1)
- `isFirstMention`: Si es la primera introducción del concepto
- `contextSnippet`: Fragmento del texto donde aparece

**Casos de uso:**

- Concepto "Herencia" aparece en lección 5 (primera vez, relevancia: 0.95)
- Concepto "Herencia" aparece en lección 8 (repaso, relevancia: 0.4)
- Estudiante en lección 8 ve: "Este concepto se introdujo en Lección 5"

---

### **ConceptRelation**

**Propósito**: Define relaciones educativas específicas entre conceptos (RF-7).

**Funciones principales:**

- Establece relaciones jerárquicas y educativas entre conceptos
- Identifica prerequisitos de aprendizaje
- Documenta cómo los conceptos se complementan o contrastan

**Tipos de relación:**

- `REQUIRES`: El concepto hijo requiere entender el padre primero
- `COMPLEMENTS`: Conceptos que se complementan
- `EXTENDS`: El hijo es una extensión/profundización del padre
- `CONTRASTS`: Conceptos que contrastan (útil para comparaciones)

**Casos de uso:**

- "Polimorfismo" REQUIRES "Herencia"
- "Interfaces" COMPLEMENTS "Clases Abstractas"
- "Sobrecarga" EXTENDS "Polimorfismo"
- Sistema sugiere orden de estudio basado en prerequisitos

---

### **ConceptSimilarity**

**Propósito**: Almacena similitudes calculadas automáticamente entre conceptos usando embeddings.

**Funciones principales:**

- Encuentra conceptos relacionados semánticamente
- Complementa las relaciones educativas manuales
- Cuenta lecciones compartidas entre conceptos
- Permite descubrir relaciones no obvias

**Campos importantes:**

- `similarityScore`: Similitud calculada por embeddings (0-1)
- `sharedLessonCount`: Cuántas lecciones comparten ambos conceptos

**Casos de uso:**

- "Encapsulamiento" y "Abstracción" tienen similitud 0.88
- Ambos aparecen juntos en 5 lecciones
- Sistema los muestra como conceptos relacionados aunque no tengan relación educativa explícita

---

## Actividades y Evaluaciones

### **Activity**

**Propósito**: Representa reactivos o evaluaciones dentro de una lección (RF-8, RF-8a).

**Funciones principales:**

- Almacena preguntas/ejercicios de diferentes tipos
- Soporta generación por IA y aprobación por docente
- Permite generar variaciones basadas en ejemplos aprobados (RF-8a)
- Rastrea linaje de actividades generadas

**Tipos de actividad:**

- `MULTIPLE_CHOICE`: Opción múltiple
- `TRUE_FALSE`: Verdadero/Falso
- `SHORT_ANSWER`: Respuesta corta
- `ESSAY`: Ensayo/respuesta larga
- `FILL_BLANK`: Llenar espacios en blanco
- `MATCHING`: Emparejar elementos
- `ORDERING`: Ordenar elementos

**Campos importantes:**

- `options`: JSON con opciones (para multiple choice, matching, etc.)
- `correctAnswer`: JSON con la respuesta correcta
- `isApprovedByTeacher`: Si el docente validó la actividad (RF-8)
- `usedAsExample`: Si se usa para generar más actividades (RF-8a)
- `generatedFromId`: ID de la actividad original si fue generada (RF-8a)

**Casos de uso:**

- Docente crea pregunta sobre "Herencia"
- IA genera 5 preguntas similares basándose en la original (RF-8a)
- Docente revisa y aprueba 3 de las 5 generadas
- Las aprobadas se marcan como `usedAsExample` para futuras generaciones

---

### **ActivityAttempt**

**Propósito**: Registra cada intento de un estudiante en una actividad.

**Funciones principales:**

- Almacena respuestas de estudiantes
- Calcula y registra si la respuesta fue correcta
- Rastrea tiempo invertido
- Permite múltiples intentos

**Campos importantes:**

- `studentAnswer`: JSON con la respuesta del estudiante
- `isCorrect`: Si la respuesta fue correcta
- `pointsEarned`: Puntos obtenidos
- `attemptNumber`: Número de intento (permite reintentos)
- `timeSpentSeconds`: Tiempo que tardó en responder

**Casos de uso:**

- Estudiante responde pregunta de opción múltiple
- Sistema califica automáticamente y registra resultado
- Analytics: docente identifica preguntas con baja tasa de aciertos (RF-11)
- Sistema identifica temas que necesitan refuerzo

---

## Contenido Generado por IA

### **GeneratedContent**

**Propósito**: Almacena todo el contenido generado por IA con sistema de versionado (RF-4, RF-5).

**Funciones principales:**

- Registra cada generación de contenido por IA
- Permite refinamiento iterativo del contenido (RF-5)
- Mantiene historial de versiones
- Almacena prompts y feedback para mejorar generaciones

**Tipos de contenido:**

- `LESSON_CONTENT`: Contenido de lección generado
- `EXPLANATION`: Explicación a estudiante sobre un tema
- `SUMMARY`: Resumen de contenido
- `QUIZ`: Reactivo generado
- `PODCAST_SCRIPT`: Script para podcast (RF-15)
- `REFINEMENT`: Refinamiento de contenido existente
- `RELATED_CONTENT`: Contenido relacionado sugerido

**Campos importantes:**

- `version`: Número de versión para rastrear refinamientos (RF-5)
- `parentContentId`: Referencia a la versión anterior
- `originalPrompt`: Prompt usado para generar
- `feedbackNotes`: Comentarios del docente para refinar (RF-5)
- `modelUsed`: Qué modelo de IA se usó
- `tokensUsed`: Tokens consumidos (para tracking de costos)

**Flujo de refinamiento (RF-5):**

```
Versión 1: Docente solicita generar contenido sobre "Herencia"
  ↓
Docente revisa y pide: "Agregar más ejemplos prácticos"
  ↓
Versión 2: IA refina incluyendo ejemplos
  ↓
Docente revisa y pide: "Simplificar el lenguaje"
  ↓
Versión 3: IA ajusta complejidad del lenguaje
```

**Casos de uso:**

- Docente genera contenido inicial con IA
- Estudiante no entiende, docente refina (RF-5)
- Sistema mantiene historial para volver a versiones anteriores
- Analytics de uso de IA por módulo

---

## Progreso y Tracking

### **LessonProgress**

**Propósito**: Rastrea el progreso individual de cada estudiante en cada lección.

**Funciones principales:**

- Registra lecciones completadas
- Mide tiempo invertido en cada lección
- Rastrea profundidad de lectura (scroll)
- Permite calcular % de completitud del módulo

**Campos importantes:**

- `isCompleted`: Si terminó la lección
- `completedAt`: Cuándo la completó
- `timeSpentSeconds`: Tiempo total invertido
- `scrollPercentage`: Qué tan abajo llegó en la página (0-100)

**Cálculo de completitud del módulo:**

```
completitud = (lecciones_completadas / total_lecciones) * 100
```

**Casos de uso:**

- Estudiante completa 8 de 10 lecciones → Progreso: 80%
- Sistema identifica lecciones con bajo tiempo de lectura
- Docente ve analytics de qué lecciones abandonan más

---

### **StudentInteraction**

**Propósito**: Tracking detallado de todas las interacciones del estudiante con el sistema (RF-11).

**Funciones principales:**

- Registra cada acción del estudiante para analytics
- Permite identificar patrones de uso
- Detecta posibles abusos de la herramienta (RF-13)
- Genera insights para docentes sobre engagement

**Tipos de interacción:**

- `VIEW`: Vio una lección
- `SCROLL`: Hizo scroll en el contenido
- `CLICK`: Click en elementos
- `SEARCH`: Buscó algo
- `DOWNLOAD`: Descargó recursos
- `VOICE_INPUT`: Usó micrófono para dictado (RF-3)
- `TEXT_TO_SPEECH`: Usó lectura con voz (RF-4)
- `AI_QUERY`: Hizo consulta a la IA
- `CONCEPT_EXPLORE`: Exploró conceptos del módulo

**Campos importantes:**

- `metadata`: JSON con datos adicionales (query text, scroll depth, etc.)
- `durationSeconds`: Duración de la interacción

**Casos de uso (RF-11, RF-13):**

- Analytics: "Estudiantes pasan 5 min promedio en Lección 3"
- Detección: "Estudiante Juan ha hecho 50 consultas a IA en 1 hora" → Notificación de uso excesivo (RF-13)
- Insights: "La búsqueda más común es 'diferencia entre clase y objeto'" → Sugerencia de crear contenido adicional

---

### **ModuleMetrics**

**Propósito**: Métricas agregadas por módulo para el dashboard del docente (RF-11).

**Funciones principales:**

- Proporciona resumen estadístico del módulo
- Identifica contenido más popular
- Calcula promedios de completitud
- Se actualiza periódicamente (job programado)

**Campos importantes:**

- `totalViews`: Total de vistas del módulo
- `totalStudents`: Estudiantes enrolados
- `averageCompletionRate`: Promedio de completitud
- `mostViewedLessonId`: Lección más vista
- `lastCalculatedAt`: Última actualización de métricas

**Casos de uso:**

- Dashboard muestra: "45 estudiantes, 78% completitud promedio"
- Identifica: "Lección 7 es la más vista (posible problema de comprensión)"
- Alerta: "Completitud ha bajado 15% este mes"

---

## Interacción Estudiante-Docente

### **StudentQuestion**

**Propósito**: Sistema de preguntas tipo foro para consultas de estudiantes (RF-12, RF-14).

**Funciones principales:**

- Estudiantes hacen preguntas sobre lecciones
- IA responde inicialmente, docente puede complementar
- Sistema de foro público o privado
- Identifica temas que generan más preguntas (RF-11)

**Estados de pregunta:**

- `PENDING`: Recién creada
- `ANSWERED_BY_AI`: IA respondió
- `ANSWERED_BY_TEACHER`: Docente respondió
- `RESOLVED`: Marcada como resuelta

**Campos importantes:**

- `questionText`: Pregunta del estudiante
- `aiResponse`: Respuesta automática de la IA
- `teacherResponse`: Respuesta del docente (opcional)
- `inferredTopic`: Tema inferido por IA (RF-11)
- `isPublic`: Si es visible en foro público
- `upvotes`: Votos para priorizar preguntas populares

**Casos de uso (RF-12, RF-14):**

- Estudiante pregunta: "¿Cómo funciona la herencia múltiple?"
- IA responde automáticamente
- Pregunta se muestra en foro público con upvotes
- Docente ve las 5 preguntas más votadas y responde
- Sistema identifica "herencia múltiple" como tema problemático (RF-11)

---

### **QuestionReply**

**Propósito**: Respuestas en hilos de preguntas (estilo foro).

**Funciones principales:**

- Permite conversaciones en hilos
- Distingue respuestas de docentes vs estudiantes
- Facilita colaboración entre estudiantes

**Campos importantes:**

- `isFromTeacher`: Identifica si quien responde es el docente

**Casos de uso:**

- Estudiante A hace pregunta
- Estudiante B responde con su perspectiva
- Docente complementa con respuesta oficial
- Estudiante A marca como resuelta

---

### **NoteAnnotation**

**Propósito**: Anotaciones y notas privadas de estudiantes (RF-12).

**Funciones principales:**

- Estudiantes toman notas sobre el contenido
- Pueden resaltar texto específico
- Opción de sugerir actualizaciones al docente (RF-12)
- Notas privadas o compartibles

**Campos importantes:**

- `noteText`: Texto de la nota
- `highlightedText`: Texto resaltado del contenido
- `position`: JSON con posición en el documento
- `suggestUpdate`: Si sugiere actualización al docente (RF-12)
- `isPrivate`: Si es visible solo para el estudiante

**Casos de uso (RF-12):**

- Estudiante resalta "método abstracto" y añade nota: "Revisar diferencia con interfaz"
- Estudiante marca "suggestUpdate": "Este ejemplo está desactualizado, Java 17 tiene nueva sintaxis"
- Administrador puede ver sugerencias, docente no (por privacidad)

---

## Notificaciones

### **Notification**

**Propósito**: Sistema de notificaciones para estudiantes y docentes (RF-13).

**Funciones principales:**

- Notifica sobre actualizaciones del módulo
- Alertas de nuevos contenidos
- Sugerencias personalizadas
- Avisos de uso excesivo de la herramienta (RF-13)

**Tipos de notificación:**

- `NEW_LESSON`: Nueva lección agregada
- `LESSON_UPDATE`: Lección actualizada
- `CONCEPT_ADDED`: Nuevo concepto identificado
- `SUGGESTED_CONTENT`: Sugerencia de contenido personalizada
- `QUESTION_ANSWERED`: Tu pregunta fue respondida
- `TEACHER_REPLY`: El docente respondió tu consulta
- `EXCESSIVE_USE_WARNING`: Alerta de uso excesivo (RF-13)
- `MODULE_UPDATE`: Actualización general del módulo

**Campos importantes:**

- `isRead`: Si el usuario leyó la notificación
- `emailSent`: Si se envió por email
- `relatedEntityId`: ID de la entidad relacionada (lección, pregunta, etc.)

**Casos de uso (RF-13):**

- Nueva lección → Notificación a todos los enrolados
- Estudiante hace 30 consultas a IA en 2 horas → `EXCESSIVE_USE_WARNING`
- Docente actualiza lección → Notificación a estudiantes que ya la vieron
- Sistema sugiere: "Podrías revisar Lección 5 basado en tu actividad"

---

## Recursos Multimedia

### **Podcast**

**Propósito**: Podcasts educativos generados para módulos o lecciones (RF-15).

**Funciones principales:**

- Almacena metadata de podcasts pre-generados
- Vincula audio a módulo o lección específica
- Guarda script generado por IA

**Campos importantes:**

- `audioUrl`: URL externa del archivo de audio (S3, Cloudinary, etc.)
- `duration`: Duración en segundos
- `scriptContent`: Guión/transcripción del podcast
- `isPublished`: Control de visibilidad

**Casos de uso (RF-15):**

- Docente genera podcast de resumen del módulo
- IA crea script basado en contenido de lecciones
- Sistema usa TTS (text-to-speech) para generar audio
- URL se almacena en servicio externo (no en BD)
- Estudiante puede escuchar mientras hace otras actividades

---

### **MediaResource**

**Propósito**: Recursos multimedia adicionales (imágenes, videos, documentos).

**Funciones principales:**

- Almacena referencias a recursos externos
- Organiza por tipo de medio
- Vincula con lecciones específicas

**Tipos de medio:**

- `IMAGE`: Imágenes, diagramas
- `VIDEO`: Videos educativos
- `AUDIO`: Audios (distintos a podcasts)
- `DOCUMENT`: PDFs, documentos
- `OTHER`: Otros tipos

**Campos importantes:**

- `url`: URL externa del recurso
- `thumbnailUrl`: Miniatura para preview
- `fileSize`: Tamaño en bytes
- `mimeType`: Tipo MIME del archivo

**Casos de uso:**

- Docente sube diagrama UML a S3
- Sistema guarda URL y metadata en BD
- Estudiante descarga/visualiza desde lección
- Analytics rastrea descargas más populares

---

## Optimización y Jobs

### **AiResponseCache**

**Propósito**: Caché de respuestas de IA para reducir costos y mejorar performance.

**Funciones principales:**

- Evita llamadas duplicadas a la API de IA
- Reutiliza respuestas para prompts similares
- Rastrea cuántas veces se reutiliza cada respuesta
- Permite limpieza de caché antiguo

**Campos importantes:**

- `promptHash`: Hash único del prompt (para búsqueda rápida)
- `response`: Respuesta almacenada
- `hits`: Contador de reutilización
- `lastUsedAt`: Última vez que se usó

**Casos de uso:**

- Estudiante A pregunta: "¿Qué es polimorfismo?"
- IA responde y se cachea
- Estudiante B hace la misma pregunta
- Sistema devuelve respuesta cacheada (sin costo de API)
- Job nocturno elimina cache no usado en 30 días

---

### **JobQueue**

**Propósito**: Cola de trabajos asíncronos para procesamiento en background.

**Funciones principales:**

- Gestiona jobs de procesamiento pesado
- Permite reintentos en caso de fallos
- Rastrea estado de cada job
- Prioriza jobs críticos

**Tipos de job:**

- `GENERATE_EMBEDDING`: Generar embedding de lección/concepto
- `EXTRACT_CONCEPTS`: Extraer conceptos de contenido
- `CALCULATE_RELATIONS`: Calcular relaciones entre lecciones/conceptos
- `GENERATE_PODCAST`: Generar podcast
- `SEND_NOTIFICATIONS`: Enviar notificaciones por email
- `UPDATE_METRICS`: Actualizar métricas agregadas

**Estados:**

- `PENDING`: En cola
- `PROCESSING`: En ejecución
- `COMPLETED`: Completado exitosamente
- `FAILED`: Falló (con mensaje de error)

**Campos importantes:**

- `entityId`: ID de la entidad a procesar
- `entityType`: Tipo ("lesson", "module", etc.)
- `payload`: Datos adicionales en JSON
- `retryCount`: Número de reintentos

**Casos de uso:**

- Docente crea lección → Job `GENERATE_EMBEDDING` se encola
- Job se procesa en background (no bloquea la UI)
- Si falla, se reintenta 3 veces
- Job programado diario: `UPDATE_METRICS` para todos los módulos
- Dashboard del admin muestra jobs pendientes/fallidos

---

## Flujos de Datos Principales

### **Flujo 1: Creación de Lección**

```
1. Docente crea lección en módulo
   ↓
2. Se guarda en tabla Lesson
   ↓
3. Se encola job: GENERATE_EMBEDDING
   ↓
4. Job genera embedding y guarda en Lesson.embedding
   ↓
5. Se encola job: EXTRACT_CONCEPTS
   ↓
6. Job extrae conceptos y crea/actualiza ModuleConcept
   ↓
7. Se encola job: CALCULATE_RELATIONS
   ↓
8. Job calcula similitud con otras lecciones y guarda en LessonRelation
   ↓
9. Se envían notificaciones a estudiantes enrolados
```

### **Flujo 2: Estudiante Completa Actividad**

```
1. Estudiante responde actividad
   ↓
2. Sistema valida respuesta
   ↓
3. Se guarda en ActivityAttempt
   ↓
4. Se actualiza LessonProgress (si completó todas las actividades)
   ↓
5. Se registra interacción en StudentInteraction
   ↓
6. Job actualiza ModuleMetrics
   ↓
7. Si respuesta incorrecta → Sugerencia de contenido relacionado
```

### **Flujo 3: Refinamiento de Contenido (RF-5)**

```
1. Docente genera contenido con IA (versión 1)
   ↓
2. Se guarda en GeneratedContent (version=1, parentContentId=null)
   ↓
3. Docente pide refinamiento con feedback
   ↓
4. Sistema envía a IA: contenido v1 + feedback
   ↓
5. Se guarda en GeneratedContent (version=2, parentContentId=v1.id)
   ↓
6. Proceso puede repetirse N veces
   ↓
7. Docente selecciona versión final para publicar
```

---

## Extensión pgvector

Para usar embeddings vectoriales necesitas instalar la extensión en PostgreSQL:

```sql
CREATE EXTENSION vector;
```

### Operaciones con vectores:

```sql
-- Buscar lecciones similares
SELECT
  l.title,
  1 - (l.embedding <=> :embedding_buscado) as similarity
FROM lessons l
WHERE l.module_id = :module_id
  AND 1 - (l.embedding <=> :embedding_buscado) > 0.7
ORDER BY similarity DESC
LIMIT 5;

-- Buscar conceptos relacionados
SELECT
  mc.name,
  1 - (mc.embedding <=> :concepto_embedding) as similarity
FROM module_concepts mc
WHERE mc.module_id = :module_id
  AND 1 - (mc.embedding <=> :concepto_embedding) > 0.7
ORDER BY similarity DESC
LIMIT 10;

-- Crear índice para búsquedas rápidas (IVFFlat)
CREATE INDEX lesson_embedding_idx ON lessons
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX concept_embedding_idx ON module_concepts
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### Operadores de distancia:

- `<=>`: Distancia coseno (recomendado para embeddings)
- `<->`: Distancia euclidiana
- `<#>`: Producto interno negativo

---

## Queries Comunes Optimizados

### 1. Dashboard del Docente (RF-11)

```sql
-- Vista general del módulo
WITH module_stats AS (
  SELECT
    COUNT(DISTINCT e.user_id) as total_students,
    AVG(
      (SELECT COUNT(*)::float
       FROM lesson_progress lp
       WHERE lp.user_id = e.user_id
         AND lp.is_completed = true
         AND lp.lesson_id IN (SELECT id FROM lessons WHERE module_id = :module_id)
      ) /
      (SELECT COUNT(*)::float FROM lessons WHERE module_id = :module_id)
    ) * 100 as avg_completion_rate
  FROM enrollments e
  WHERE e.module_id = :module_id
    AND e.is_active = true
),
lesson_stats AS (
  SELECT
    l.id,
    l.title,
    COUNT(DISTINCT si.user_id) as unique_views,
    AVG(lp.time_spent_seconds) as avg_time_spent,
    COUNT(DISTINCT CASE WHEN lp.is_completed THEN lp.user_id END) as completions
  FROM lessons l
  LEFT JOIN student_interactions si ON si.lesson_id = l.id
    AND si.interaction_type = 'VIEW'
  LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id
  WHERE l.module_id = :module_id
  GROUP BY l.id, l.title
),
frequent_questions AS (
  SELECT
    sq.inferred_topic,
    COUNT(*) as question_count
  FROM student_questions sq
  JOIN lessons l ON l.id = sq.lesson_id
  WHERE l.module_id = :module_id
    AND sq.inferred_topic IS NOT NULL
  GROUP BY sq.inferred_topic
  ORDER BY question_count DESC
  LIMIT 5
)
SELECT
  (SELECT * FROM module_stats) as module_overview,
  (SELECT json_agg(row_to_json(ls)) FROM lesson_stats ls ORDER BY ls.unique_views DESC) as lesson_metrics,
  (SELECT json_agg(row_to_json(fq)) FROM frequent_questions fq) as common_questions;
```

### 2. Mapa de Conceptos del Módulo

```sql
-- Obtener todos los conceptos con sus relaciones
WITH concept_data AS (
  SELECT
    mc.id,
    mc.name,
    mc.definition,
    mc.importance,
    mc.frequency,
    mc.concept_type,
    COUNT(DISTINCT cl.lesson_id) as lesson_count,
    json_agg(DISTINCT jsonb_build_object(
      'lesson_id', l.id,
      'lesson_title', l.title,
      'relevance', cl.relevance,
      'is_first_mention', cl.is_first_mention
    )) as lessons
  FROM module_concepts mc
  LEFT JOIN concept_lessons cl ON cl.concept_id = mc.id
  LEFT JOIN lessons l ON l.id = cl.lesson_id
  WHERE mc.module_id = :module_id
  GROUP BY mc.id
),
concept_relations_data AS (
  SELECT
    cr.parent_concept_id,
    cr.child_concept_id,
    cr.relation_type,
    cr.explanation,
    parent.name as parent_name,
    child.name as child_name
  FROM concept_relations cr
  JOIN module_concepts parent ON parent.id = cr.parent_concept_id
  JOIN module_concepts child ON child.id = cr.child_concept_id
  WHERE parent.module_id = :module_id
),
concept_similarities_data AS (
  SELECT
    cs.origin_concept_id,
    cs.similar_concept_id,
    cs.similarity_score,
    cs.shared_lesson_count,
    origin.name as origin_name,
    similar.name as similar_name
  FROM concept_similarities cs
  JOIN module_concepts origin ON origin.id = cs.origin_concept_id
  JOIN module_concepts similar ON similar.id = cs.similar_concept_id
  WHERE origin.module_id = :module_id
    AND cs.similarity_score > 0.7
)
SELECT
  (SELECT json_agg(row_to_json(cd)) FROM concept_data cd ORDER BY cd.importance DESC) as concepts,
  (SELECT json_agg(row_to_json(crd)) FROM concept_relations_data crd) as relations,
  (SELECT json_agg(row_to_json(csd)) FROM concept_similarities_data csd) as similarities;
```

### 3. Vista de Lección para Estudiante

```sql
-- Toda la información que necesita un estudiante al ver una lección
WITH lesson_data AS (
  SELECT
    l.*,
    m.title as module_title,
    m.allow_self_enroll,
    u.first_name as teacher_first_name,
    u.last_name as teacher_last_name
  FROM lessons l
  JOIN modules m ON m.id = l.module_id
  JOIN users u ON u.id = m.teacher_id
  WHERE l.id = :lesson_id
),
related_lessons AS (
  SELECT
    rl.id,
    rl.title,
    lr.similarity_score,
    lr.relation_type,
    lr.common_themes
  FROM lesson_relations lr
  JOIN lessons rl ON rl.id = lr.related_lesson_id
  WHERE lr.origin_lesson_id = :lesson_id
  ORDER BY lr.similarity_score DESC
  LIMIT 5
),
lesson_concepts AS (
  SELECT
    mc.id,
    mc.name,
    mc.definition,
    mc.importance,
    cl.relevance,
    cl.is_first_mention
  FROM concept_lessons cl
  JOIN module_concepts mc ON mc.id = cl.concept_id
  WHERE cl.lesson_id = :lesson_id
  ORDER BY cl.relevance DESC
),
lesson_activities AS (
  SELECT
    a.id,
    a.type,
    a.question,
    a.options,
    a.difficulty,
    a.points,
    a.order_index,
    CASE
      WHEN aa.id IS NOT NULL THEN jsonb_build_object(
        'completed', true,
        'is_correct', aa.is_correct,
        'points_earned', aa.points_earned,
        'attempt_number', aa.attempt_number
      )
      ELSE jsonb_build_object('completed', false)
    END as student_attempt
  FROM activities a
  LEFT JOIN LATERAL (
    SELECT * FROM activity_attempts
    WHERE activity_id = a.id
      AND user_id = :student_id
    ORDER BY created_at DESC
    LIMIT 1
  ) aa ON true
  WHERE a.lesson_id = :lesson_id
  ORDER BY a.order_index
),
student_progress AS (
  SELECT
    lp.is_completed,
    lp.time_spent_seconds,
    lp.scroll_percentage,
    lp.last_accessed_at
  FROM lesson_progress lp
  WHERE lp.lesson_id = :lesson_id
    AND lp.user_id = :student_id
),
media_resources AS (
  SELECT
    mr.id,
    mr.type,
    mr.title,
    mr.url,
    mr.thumbnail_url,
    mr.mime_type
  FROM media_resources mr
  WHERE mr.lesson_id = :lesson_id
),
student_notes AS (
  SELECT
    na.id,
    na.note_text,
    na.highlighted_text,
    na.position,
    na.created_at
  FROM note_annotations na
  WHERE na.lesson_id = :lesson_id
    AND na.user_id = :student_id
    AND na.is_private = true
  ORDER BY na.created_at DESC
)
SELECT
  (SELECT row_to_json(ld) FROM lesson_data ld) as lesson,
  (SELECT json_agg(row_to_json(rl)) FROM related_lessons rl) as related_lessons,
  (SELECT json_agg(row_to_json(lc)) FROM lesson_concepts lc) as concepts,
  (SELECT json_agg(row_to_json(la)) FROM lesson_activities la) as activities,
  (SELECT row_to_json(sp) FROM student_progress sp) as progress,
  (SELECT json_agg(row_to_json(mr)) FROM media_resources mr) as media,
  (SELECT json_agg(row_to_json(sn)) FROM student_notes sn) as notes;
```

### 4. Identificar Lecciones que Necesitan Refuerzo (RF-11)

```sql
-- Encuentra lecciones con baja tasa de éxito en actividades
WITH lesson_performance AS (
  SELECT
    l.id as lesson_id,
    l.title,
    COUNT(DISTINCT aa.user_id) as students_attempted,
    COUNT(*) as total_attempts,
    AVG(CASE WHEN aa.is_correct THEN 1 ELSE 0 END) as success_rate,
    COUNT(DISTINCT sq.id) as question_count
  FROM lessons l
  LEFT JOIN activities a ON a.lesson_id = l.id
  LEFT JOIN activity_attempts aa ON aa.activity_id = a.id
  LEFT JOIN student_questions sq ON sq.lesson_id = l.id
  WHERE l.module_id = :module_id
  GROUP BY l.id, l.title
  HAVING COUNT(DISTINCT aa.user_id) >= 5  -- al menos 5 estudiantes
),
topic_questions AS (
  SELECT
    sq.lesson_id,
    sq.inferred_topic,
    COUNT(*) as frequency
  FROM student_questions sq
  JOIN lessons l ON l.id = sq.lesson_id
  WHERE l.module_id = :module_id
    AND sq.inferred_topic IS NOT NULL
  GROUP BY sq.lesson_id, sq.inferred_topic
  ORDER BY frequency DESC
)
SELECT
  lp.*,
  CASE
    WHEN lp.success_rate < 0.6 THEN 'needs_reinforcement'
    WHEN lp.question_count > 10 THEN 'high_confusion'
    WHEN lp.success_rate < 0.75 THEN 'moderate_difficulty'
    ELSE 'good'
  END as status,
  (
    SELECT json_agg(
      jsonb_build_object('topic', tq.inferred_topic, 'count', tq.frequency)
    )
    FROM topic_questions tq
    WHERE tq.lesson_id = lp.lesson_id
    LIMIT 5
  ) as common_question_topics
FROM lesson_performance lp
ORDER BY
  CASE
    WHEN lp.success_rate < 0.6 THEN 1
    WHEN lp.question_count > 10 THEN 2
    ELSE 3
  END,
  lp.success_rate ASC;
```

### 5. Sugerencias de Contenido Personalizado (RF-11)

```sql
-- Genera sugerencias basadas en el comportamiento del estudiante
WITH student_weak_concepts AS (
  SELECT
    mc.id as concept_id,
    mc.name,
    AVG(CASE WHEN aa.is_correct THEN 1.0 ELSE 0.0 END) as success_rate,
    COUNT(DISTINCT aa.id) as attempts
  FROM module_concepts mc
  JOIN concept_lessons cl ON cl.concept_id = mc.id
  JOIN activities a ON a.lesson_id = cl.lesson_id
  JOIN activity_attempts aa ON aa.activity_id = a.id
  WHERE aa.user_id = :student_id
    AND mc.module_id = :module_id
  GROUP BY mc.id, mc.name
  HAVING AVG(CASE WHEN aa.is_correct THEN 1.0 ELSE 0.0 END) < 0.7
    AND COUNT(DISTINCT aa.id) >= 3
),
prerequisite_concepts AS (
  SELECT DISTINCT
    cr.parent_concept_id,
    parent.name as prerequisite_name
  FROM student_weak_concepts swc
  JOIN concept_relations cr ON cr.child_concept_id = swc.concept_id
  JOIN module_concepts parent ON parent.id = cr.parent_concept_id
  WHERE cr.relation_type = 'REQUIRES'
),
suggested_lessons AS (
  SELECT DISTINCT
    l.id,
    l.title,
    cl.relevance,
    mc.name as concept_name,
    CASE
      WHEN pc.parent_concept_id IS NOT NULL THEN 'prerequisite'
      WHEN swc.concept_id IS NOT NULL THEN 'reinforcement'
      ELSE 'related'
    END as suggestion_type
  FROM lessons l
  JOIN concept_lessons cl ON cl.lesson_id = l.id
  JOIN module_concepts mc ON mc.id = cl.concept_id
  LEFT JOIN student_weak_concepts swc ON swc.concept_id = mc.id
  LEFT JOIN prerequisite_concepts pc ON pc.parent_concept_id = mc.id
  LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = :student_id
  WHERE l.module_id = :module_id
    AND (swc.concept_id IS NOT NULL OR pc.parent_concept_id IS NOT NULL)
    AND (lp.is_completed IS NULL OR lp.is_completed = false)
    AND cl.relevance > 0.5
  ORDER BY
    CASE
      WHEN pc.parent_concept_id IS NOT NULL THEN 1
      WHEN swc.concept_id IS NOT NULL THEN 2
      ELSE 3
    END,
    cl.relevance DESC
  LIMIT 5
)
SELECT * FROM suggested_lessons;
```

### 6. Detección de Uso Excesivo de IA (RF-13)

```sql
-- Detecta estudiantes con uso excesivo de la herramienta
WITH recent_ai_usage AS (
  SELECT
    si.user_id,
    COUNT(*) as ai_queries,
    MAX(si.created_at) as last_query,
    AVG(si.duration_seconds) as avg_duration,
    COUNT(DISTINCT si.lesson_id) as lessons_queried
  FROM student_interactions si
  WHERE si.interaction_type = 'AI_QUERY'
    AND si.created_at >= NOW() - INTERVAL '2 hours'
  GROUP BY si.user_id
),
activity_completion AS (
  SELECT
    aa.user_id,
    COUNT(DISTINCT aa.activity_id) as activities_completed,
    AVG(CASE WHEN aa.is_correct THEN 1.0 ELSE 0.0 END) as success_rate
  FROM activity_attempts aa
  WHERE aa.created_at >= NOW() - INTERVAL '2 hours'
  GROUP BY aa.user_id
)
SELECT
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  rau.ai_queries,
  rau.avg_duration,
  rau.lessons_queried,
  COALESCE(ac.activities_completed, 0) as activities_completed,
  COALESCE(ac.success_rate, 0) as success_rate,
  CASE
    WHEN rau.ai_queries > 30 AND COALESCE(ac.activities_completed, 0) < 5 THEN 'critical'
    WHEN rau.ai_queries > 20 AND rau.avg_duration < 10 THEN 'warning'
    WHEN rau.ai_queries > 15 THEN 'monitor'
    ELSE 'normal'
  END as alert_level
FROM recent_ai_usage rau
JOIN users u ON u.id = rau.user_id
LEFT JOIN activity_completion ac ON ac.user_id = rau.user_id
WHERE rau.ai_queries > 15
ORDER BY rau.ai_queries DESC;
```

### 7. Preguntas Más Frecuentes por Módulo (RF-11)

```sql
-- Identifica temas problemáticos basado en preguntas frecuentes
WITH question_clusters AS (
  SELECT
    sq.inferred_topic,
    sq.lesson_id,
    l.title as lesson_title,
    COUNT(*) as question_count,
    COUNT(DISTINCT sq.user_id) as unique_students,
    AVG(sq.upvotes) as avg_upvotes,
    json_agg(
      jsonb_build_object(
        'question', LEFT(sq.question_text, 100),
        'upvotes', sq.upvotes,
        'status', sq.status
      ) ORDER BY sq.upvotes DESC
    ) FILTER (WHERE sq.upvotes > 0) as top_questions
  FROM student_questions sq
  JOIN lessons l ON l.id = sq.lesson_id
  WHERE l.module_id = :module_id
    AND sq.inferred_topic IS NOT NULL
  GROUP BY sq.inferred_topic, sq.lesson_id, l.title
)
SELECT
  qc.inferred_topic,
  qc.lesson_title,
  qc.question_count,
  qc.unique_students,
  qc.avg_upvotes,
  qc.top_questions,
  CASE
    WHEN qc.question_count > 20 THEN 'critical'
    WHEN qc.question_count > 10 THEN 'high'
    WHEN qc.question_count > 5 THEN 'medium'
    ELSE 'low'
  END as priority
FROM question_clusters qc
ORDER BY qc.question_count DESC, qc.avg_upvotes DESC
LIMIT 10;
```

---

## Estrategias de Indexación

### Índices recomendados para performance:

```sql
-- Índices para búsquedas de embeddings (ya están en el schema)
CREATE INDEX lesson_embedding_idx ON lessons
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX concept_embedding_idx ON module_concepts
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Índices para queries frecuentes
CREATE INDEX idx_enrollments_user_active ON enrollments(user_id)
WHERE is_active = true;

CREATE INDEX idx_lesson_progress_completion ON lesson_progress(user_id, is_completed);

CREATE INDEX idx_student_interactions_recent ON student_interactions(user_id, created_at DESC);

CREATE INDEX idx_activity_attempts_student ON activity_attempts(user_id, activity_id, created_at DESC);

CREATE INDEX idx_student_questions_topic ON student_questions(inferred_topic, lesson_id)
WHERE inferred_topic IS NOT NULL;

CREATE INDEX idx_notifications_unread ON notifications(user_id, created_at DESC)
WHERE is_read = false;

CREATE INDEX idx_generated_content_version ON generated_content(lesson_id, version DESC);

-- Índice para búsqueda de conceptos por nombre (case-insensitive)
CREATE INDEX idx_module_concepts_name ON module_concepts(module_id, LOWER(name));

-- Índice compuesto para dashboard de docente
CREATE INDEX idx_module_metrics ON lessons(module_id, is_published, created_at DESC);
```

---

## Mantenimiento y Limpieza

### Jobs de mantenimiento recomendados:

```sql
-- 1. Limpiar cache de IA antiguo (semanal)
DELETE FROM ai_response_cache
WHERE last_used_at < NOW() - INTERVAL '30 days'
  AND hits < 5;

-- 2. Archivar notificaciones viejas leídas (mensual)
DELETE FROM notifications
WHERE is_read = true
  AND created_at < NOW() - INTERVAL '90 days';

-- 3. Limpiar jobs completados antiguos (semanal)
DELETE FROM job_queue
WHERE status = 'COMPLETED'
  AND completed_at < NOW() - INTERVAL '7 days';

-- 4. Limpiar jobs fallidos muy antiguos (mensual)
DELETE FROM job_queue
WHERE status = 'FAILED'
  AND created_at < NOW() - INTERVAL '30 days'
  AND retry_count >= 3;

-- 5. Vacuum y análisis (semanal, ejecutar como superusuario)
VACUUM ANALYZE lessons;
VACUUM ANALYZE module_concepts;
VACUUM ANALYZE student_interactions;
VACUUM ANALYZE activity_attempts;
```

---

## Estimación de Tamaño de Base de Datos

Para un módulo típico con **50 lecciones** y **100 estudiantes**:

| Tabla                | Registros Aprox. | Tamaño Estimado   |
| -------------------- | ---------------- | ----------------- |
| lessons              | 50               | 500 KB            |
| module_concepts      | 150              | 100 KB            |
| concept_lessons      | 500              | 50 KB             |
| lesson_relations     | 250              | 30 KB             |
| concept_similarities | 750              | 75 KB             |
| activities           | 200              | 300 KB            |
| activity_attempts    | 20,000           | 5 MB              |
| lesson_progress      | 5,000            | 500 KB            |
| student_interactions | 50,000           | 10 MB             |
| student_questions    | 500              | 1 MB              |
| generated_content    | 1,000            | 5 MB              |
| notifications        | 10,000           | 2 MB              |
| **TOTAL**            |                  | **~25 MB/módulo** |

**Para 100 módulos activos**: ~2.5 GB

**Con vectores (embeddings)**: Multiplicar por 1.5-2x → ~5 GB

---

## Mejores Prácticas

### 1. **Gestión de Embeddings**

- Genera embeddings de forma asíncrona (jobs en background)
- Cachea embeddings - no recalcules si el contenido no cambió
- Usa batch processing para generar múltiples embeddings

### 2. **Optimización de Costos de IA**

- Siempre verifica `ai_response_cache` antes de llamar a la API
- Usa modelos económicos para tareas simples (GPT-4o-mini)
- Procesa extracciones de conceptos por lotes

### 3. **Performance de Queries**

- Usa paginación para listados largos
- Materializa vistas para dashboards complejos
- Considera cache en aplicación (Redis) para datos frecuentes

### 4. **Seguridad**

- Nunca exponer embeddings en APIs públicas
- Validar permisos: estudiantes solo ven sus propios datos
- Docentes solo acceden a módulos que les pertenecen
- Admins tienen acceso completo pero registrado

### 5. **Backup y Recuperación**

- Backup diario de base de datos completa
- Backup incremental cada 6 horas para tablas críticas
- Retener backups 30 días mínimo
- Probar restauración mensualmente

---

## Migración y Versionado

### Estrategia de migración con Prisma:

```bash
# Crear nueva migración
npx prisma migrate dev --name add_feature_x

# Aplicar en producción
npx prisma migrate deploy

# Verificar estado
npx prisma migrate status
```

### Rollback manual si es necesario:

```sql
-- Ver historial de migraciones
SELECT * FROM _prisma_migrations ORDER BY finished_at DESC;

-- Revertir última migración (cuidado!)
-- 1. Guardar backup primero
-- 2. Ejecutar migración de rollback específica
-- 3. Actualizar tabla _prisma_migrations
```

---

## Conclusión

Esta base de datos está diseñada para:

✅ **Escalabilidad**: Soporta múltiples módulos, miles de estudiantes
✅ **Performance**: Índices optimizados, embeddings vectoriales eficientes  
✅ **Inteligencia**: IA integrada con caché y versionado
✅ **Analytics**: Tracking completo para insights educativos
✅ **Flexibilidad**: Soporta múltiples tipos de contenido y actividades
✅ **Economía**: Optimizaciones para reducir costos de API

Todas las funcionalidades del documento de requisitos están cubiertas y listas para implementación.
