# 📝 Reporte de Refactorización: Migración de "Page" a "Learning Object"

Este documento detalla los cambios estructurales y semánticos realizados en la API para alinear el sistema con el nuevo enfoque de **Objetos de Aprendizaje (LO)**.

---

## 1. Resumen de Cambios por Módulo

### A. Módulo Core: Learning Objects

- **Rutas:** Se migró de `/pages` a `/learning-objects`.
- **Servicios (`LoService`, `LoHelperService`):** \* Métodos renombrados (ej: `getPageForRead` ➔ `getLoForRead`).
  - Mensajes de error actualizados de "Página" a "Objeto de aprendizaje".
- **Mappers & DTOs:** \* `mapToFullPageDto` ➔ `mapToFullLoDto`.
  - En `FullLoDto`, la propiedad `pageFeedbacks` ahora es `loFeedbacks`.

### B. Módulo de Interacciones (Notas, Feedbacks, Preguntas, Actividades)

- **Rutas:** Todas las rutas dependientes de `/pages` o `/page-feedbacks` ahora cuelgan de `/learning-objects` o `/learning-object-feedbacks`.
- **Propiedades de Datos:** En todos los DTOs de entrada y salida, la propiedad `pageId` ha sido renombrada a `learningObjectId`.
- **Ejemplos:** `CreateStudentQuestionDto`, `NoteDto`, `ActivityDto`.

### C. Módulo de Chat

- **Rutas:** `/pages/:pageId/sessions` ➔ `/learning-objects/:learningObjectId/sessions`.
- **Mappers:** `ChatMapper` ahora procesa directamente `learningObjectId`.

### D. Generación de Contenido (Relations, Concepts, Activities)

- **Semántica de Servicios:** Refactorización de métodos como `generateLoRelations`.
- **DTOs de Request:** Se renombró `pageId` a `learningObjectId` en los flujos de generación de relaciones, extracción de conceptos y actividades.

### E. La Excepción: Submódulo `page-content` (Híbrido)

Para mantener la coherencia con la lógica interna de generación, este módulo se mantiene como una "isla" semántica:

- **Estructura:** Se conserva en `src/features/content-generation/page-content/`.
- **Código Interno:** La clase `PageContentService` y sus métodos (`generatePageContent`) permanecen intactos, utilizando la variable `page` internamente.
- **Capa Pública (API):** **SÍ se renombró** `pageId` a `learningObjectId` en los DTOs (`GenerateContentDto`, `RegenerateContentDto`) para mantener la uniformidad con el Frontend.

---

## 2. Justificación Técnica

1. **Consistencia Semántica:** El sistema ahora refleja el lenguaje de negocio acordado.
2. **Encapsulamiento:** La excepción en `page-content` permite trabajar la generación de texto como una unidad lógica independiente sin romper el contrato global.
3. **Estabilidad del Contrato:** La unificación de IDs evita errores de "propiedad no encontrada" en el consumo de la API.

---

## 🚀 Guía de Migración para Frontend (Breaking Changes)

> **IMPORTANTE:** Esta migración es obligatoria. El backend ya no reconoce el término `pageId` en sus contratos públicos (excepto en logs internos).

### 1. Renombre de Propiedades (Global Search & Replace)

**Qué cambiar:** 
- `pageId` ➔ **`learningObjectId`**
- `page` ➔ **`learningObject`** (en relaciones u objetos anidados)

**Dónde buscar:**
- **Interfaces/Tipos:** Buscá en `src/interfaces/`, `src/types/` o donde definas tus modelos de datos.
- **State Management:** Si usás Redux, Pinia o Signals, revisá las acciones y selectores que manejan el ID de la página actual.
- **Componentes de Formulario:** Revisá los `name` de los inputs o los objetos que enviás en los `onSubmit`.

### 2. Actualización de Endpoints

Actualizá tus constantes de rutas o servicios de API:

| Recurso              | Ruta Antigua          | Ruta Nueva                       |
| :------------------- | :-------------------- | :------------------------------- |
| **Learning Objects** | `/pages`              | **`/learning-objects`**          |
| **Feedbacks**        | `/page-feedbacks`     | **`/learning-object-feedbacks`** |
| **Chat Sessions**    | `/pages/:id/sessions` | **`/learning-objects/:id/sessions`** |

### 3. Cambios Específicos en DTOs y Mappers

**A. Objeto de Aprendizaje Completo (`FullLoDto`):**
- **Dónde:** En el componente que renderiza el contenido del LO y sus feedbacks.
- **Cambio:** La propiedad `pageFeedbacks` ahora se llama **`loFeedbacks`**.

**B. Reordenamiento de Contenido:**
- **Dónde:** En la lógica de Drag & Drop de los módulos.
- **Cambio:** El body del `PUT/PATCH` ahora espera una propiedad **`los`** (antes `pages`) que contiene el array de IDs.

**C. Relaciones entre Contenidos:**
- **Dónde:** Módulo de grafos o enlaces entre páginas.
- **Cambio:** 
  - `originPageId` ➔ **`originLoId`**
  - `relatedPageId` ➔ **`relatedLoId`**

### 4. Generación de Contenido (AI)

**Dónde:** Servicios que llaman a `/content/generate-content` o `/content/regenerate-content`.
**Cambio:** El objeto enviado debe usar **`learningObjectId`**. Aunque el módulo interno diga "page-content", el contrato externo es LO.

---

### 💡 Tip para el equipo:
Si usan TypeScript, empiecen renombrando la propiedad en la interfaz base del `LearningObject`. El compilador les va a gritar exactamente en qué archivos y líneas de código tienen que aplicar el resto de los cambios.
