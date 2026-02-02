---
name: pages-ai-endpoints
overview: Completar el módulo de páginas (wiki/lecciones) agregando endpoints manuales para funcionalidades de IA (sugerencias) y CRUD para edición manual (conceptos, relaciones, actividades, chat), manteniendo doble formato por bloque (normalizado + TipTap) y sin depender de colas.
todos:
  - id: manual-mode-remove-enqueue
    content: Cambiar `PagesService` para no encolar trabajos y exponer endpoints manuales de sugerencias (sin colas).
    status: completed
  - id: concepts-suggest-and-crud
    content: Implementar `POST /pages/:id/concepts/suggest` y CRUD completo para `PageConcept`.
    status: completed
  - id: chat-sessions-messages
    content: Implementar sesiones/mensajes de chat por página con estrategia híbrida (DB + `aiResponseId`).
    status: completed
  - id: activities-suggest-crud-attempts
    content: Implementar generación de una actividad por llamada + CRUD de `Activity` y attempts de estudiantes.
    status: completed
  - id: relations-suggest-crud
    content: Implementar sugerencia de relaciones (embeddings + razonamiento) y CRUD de `PageRelation`.
    status: completed
  - id: images-suggest-generate-media
    content: Implementar generación de imágenes y persistencia opcional en `MediaResource`.
    status: completed
isProject: false
---

## Estado actual (lo que ya existe)

- **Páginas y contenido**: `PagesController`/`PagesService` ya soportan crear/listar/obtener/actualizar y `PATCH /pages/:id/content` para upsert+replace de `Block` (`content` JSON “normalizado” + `tipTapContent` JSON TipTap opcional).
- **IA**:
- `POST /content/generate` genera `{title, keywords, blocks[]}` en formato normalizado (TEXT/CODE/IMAGE_SUGGESTION) usando `OpenaiService.getResponse`.
- Hay prompt y service para extracción de conceptos (`extractPageConceptsPrompt` + `ContentGenerationService.extractPageConcepts`), y existe `ConceptsWorker` (se mantendrá pero **no se usará** por ahora).
- **Modelos Prisma ya listos** para el resto del módulo: `Activity`, `ActivityAttempt`, `Session`, `Message`, `PageRelation`, `PageConcept`, `MediaResource`.

## Principios de diseño (para evitar el problema TipTap vs normalizado)

- **Fuente de verdad de edición**: persistir siempre `Block.content` (normalizado) y **también** `Block.tipTapContent` (TipTap). El frontend enviará ambos en cada guardado (en cada bloque, `tipTapContent` puede ser `null`).
- **Endpoints de IA = “suggest-only”**: la IA solo devuelve sugerencias; el profesor (o estudiante en actividades/chat) decide qué persistir usando endpoints CRUD.
- **Anotaciones a nivel de bloque**: conceptos y relaciones devuelven anclas `{ blockId, term/mentionText, ... }` (no offsets). El frontend aplica marks/enlaces dentro del bloque.
- **Chat híbrido**: guardar historial en DB (`Session`/`Message`) y además conservar `aiResponseId` para continuidad con OpenAI Responses.

## Endpoints a implementar/proponer (por funcionalidad)

### 1) Regeneración / refinamiento de contenido (profesor)

- **POST**  `/content/regenerate` (nuevo)
- **Req**: `pageId`, `instruction`, opcional: `scope` (p.ej. `blockIds[]` o `all`), `currentBlocks` (normalizado) o `pageSnapshotVersion`.
- **Res**: sugerencias de `blocks[]` (mismo esquema de `AiContentBlock`) + `responseId`.
- **Nota**: NO persiste. El frontend aplica y luego llama `PATCH /pages/:id/content`.

### 2) Generación de imágenes (profesor)

- **POST**  `/content/images/generate` (nuevo)
- **Req**: `prompt` (y opcional `pageId`, `blockId`).
- **Res**: `{ url }` desde `OpenaiService.generateImage`.
- **Persistencia manual**: opcionalmente crear `MediaResource` vía endpoint separado (ver abajo).

### 3) Conceptos (tooltips) manual + sugeridos (profesor)

- **POST**  `/pages/:id/concepts/suggest` (nuevo)
- **Req**: `{ blockIds?: number[], maxTerms?, maxDefinitionLength? }`.
- **Res**: `{ anchors: [{ blockId, terms: [{ term, definition }] }] }`.
- Implementación: reutilizar `ContentGenerationService.extractPageConcepts` pero construyendo `textBlocks` por bloque TEXT.
- **CRUD manual de conceptos** (nuevo controller/service `page-concepts`)
- **GET**  `/pages/:id/concepts` (listar)
- **POST**  `/pages/:id/concepts` (crear manual)
- **PATCH**  `/pages/:id/concepts/:conceptId` (editar)
- **DELETE**  `/pages/:id/concepts/:conceptId`
- Tabla: `PageConcept`.

### 4) Actividades (profesor o estudiante)

- **POST**  `/pages/:id/activities/generate` (nuevo)
- **Req**: `{ type: ActivityType, difficulty?, scopeBlockIds?, instructions? }`
- **Res**: una actividad generada (sin `id`), incluyendo `question`, `options` (si aplica), `correctAnswer` y `explanation` según el tipo.
- **Nota**: NO persiste. El frontend permite edición/confirmación y luego guarda vía CRUD.
- **CRUD de actividades** (nuevo `activities` module)
- **GET**  `/pages/:id/activities`
- **POST**  `/pages/:id/activities`
- **PATCH**  `/pages/:id/activities/:activityId`
- **DELETE**  `/pages/:id/activities/:activityId`
- **POST**  `/activities/:activityId/attempts` (estudiante) para `ActivityAttempt`.

### 5) Chat por página (estudiante)

- **POST**  `/pages/:id/sessions` (nuevo)
- Crea/retorna sesión para usuario+page (ya hay `@@unique([userId, pageId])`).
- **POST**  `/sessions/:sessionId/messages` (nuevo)
- Guarda mensaje del usuario; llama a IA con contexto (bloques + últimos N mensajes) y/o `previous_response_id`.
- Persiste respuesta como `Message(role=assistant)` y actualiza `Page.aiResponseId` o un nuevo campo en `Session` (recomendado) para continuidad.
- **GET**  `/sessions/:sessionId/messages` (historial).

### 6) Relaciones entre páginas (embeddings + razonamiento) manual

- **POST**  `/pages/:id/relations/suggest` (nuevo)
- **Req**: `{ topK?, minScore?, relationTypes?, scopeBlockIds? }`.
- **Res**: `{ suggestions: [{ relatedPageId, similarityScore, relationType, anchors: [{ blockId, mentionText, explanation? }] }] }`.
- Implementación en 2 fases:
- **Embeddings**: calcular embedding de la página origen usando `compiledContent` (o compilar desde bloques TEXT+CODE) con `OpenaiService.getEmbedding` y comparar contra `Page.embedding` del resto.
- **Razonamiento**: pedir a IA que explique/etiquete `relationType` y proponga `mentionText` por bloque (ancla por bloque).
- **CRUD manual de relaciones** (nuevo)
- **GET**  `/pages/:id/relations`
- **POST**  `/pages/:id/relations` (crear manual)
- **PATCH**  `/pages/:id/relations/:relationId` (editar)
- **DELETE**  `/pages/:id/relations/:relationId`
- Tabla: `PageRelation`.

### 7) Utilidades de persistencia de recursos

- **CRUD de `MediaResource`** (opcional pero práctico para imágenes generadas)
- **POST**  `/pages/:id/media-resources`
- **GET**  `/pages/:id/media-resources`
- etc.

## Cambios internos necesarios (sin ejecutar todavía)

- **Routing**: crear módulos/controllers/services nuevos bajo `src/features/pages/` para `page-concepts`, `page-relations`, `activities`, `sessions/messages`.
- **Reutilización**: 
- Reusar el esquema de bloques existente (`BlockType`, `AiContentBlock`) para sugerencias.
- Reusar `OpenaiService.getResponse` y `getEmbedding`.
- **Permisos**:
- Profesor: CRUD de páginas/actividades/conceptos/relaciones, endpoints `suggest`.
- Estudiante: chat, listar páginas publicadas, attempts de actividades, ver conceptos/relaciones si la página es accesible.
- **Colas**: mantener BullMQ/`ConceptsWorker` sin invocarlo (no encolar desde `update`/`updateContent`).

## Archivos clave a tocar

- [`C:\Users\dzhu2\dev\projects\edu-assistant-api\src\features\pages\main\pages.service.ts`](C:\Users\dzhu2\dev\projects\edu-assistant-api\src\features\pages\main\pages.service.ts): dejar de encolar trabajos y mover a modo manual.
- [`C:\Users\dzhu2\dev\projects\edu-assistant-api\src\features\pages\content-generation\content-generation.controller.ts`](C:\Users\dzhu2\dev\projects\edu-assistant-api\src\features\pages\content-generation\content-generation.controller.ts): añadir endpoints `regenerate`, `concepts/suggest`, `images/generate`, `relations/suggest` (o separar controllers por dominio).
- Nuevos módulos en `src/features/pages/` para CRUD de `PageConcept`, `PageRelation`, `Activity`, `Session/Message`.

## Orden recomendado de implementación

1) **Modo manual**: quitar encolado en `PagesService.update`/`updateContent` (sin borrar worker).
2) **Conceptos**: `suggest` + CRUD `PageConcept` (porque ya tienes prompts y tabla).
3) **Chat**: sesiones + mensajes + persistencia híbrida (DB + `aiResponseId`).
4) **Actividades**: `generate` (una por request) + CRUD + attempts.
5) **Relaciones**: embeddings + sugerencia + CRUD.
6) **Imágenes**: generate + media resources.