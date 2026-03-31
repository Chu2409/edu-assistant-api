# Edu Assistant API - Documentación para Desarrolladores

Bienvenido al proyecto **Edu Assistant API**. Este documento proporciona un resumen conciso y estructurado para ayudar a nuevos desarrolladores a comprender el contexto, la arquitectura y los componentes más importantes del sistema.

---

## 🚀 1. Visión General del Proyecto

**Edu Assistant API** es el backend de una plataforma educativa inteligente construida con **NestJS**. Su objetivo principal es gestionar cursos (módulos), lecciones (páginas), interacciones de estudiantes y aprovechar la Inteligencia Artificial para la generación de contenido (lecciones, resúmenes, reactivos/quizzes) e interacción mediante chat.

### Stack Tecnológico Principal

- **Framework Backend**: NestJS (v11)
- **Lenguaje**: TypeScript (Node.js v24 LTS)
- **Gestor de Paquetes**: `pnpm`
- **Base de Datos**: PostgreSQL + **pgvector** (crucial para embeddings de IA)
- **ORM**: Prisma (v7.4)
- **Caché y Tareas en Segundo Plano**: Redis + BullMQ
- **Integración IA**: OpenAI SDK con validación estructural usando `zod`
- **Autenticación**: JWT y Passport (con integración para Microsoft SSO)
- **Despliegue**: Docker y Docker Compose (Multi-stage builds)

---

## 🏗️ 2. Arquitectura del Sistema

El ecosistema está dividido en dos procesos principales y varios contenedores, definidos en los archivos `docker-compose-*.yaml`:

1. **API Server (`src/main.ts`)**: El servidor HTTP RESTful de NestJS que expone los endpoints (prefijo `/api`) para la web o aplicaciones cliente. Documentación automática generada con Swagger (`/api/docs`).
2. **Worker Server (`src/worker.ts` & `src/worker.module.ts`)**: Un proceso en segundo plano (corriendo la misma imagen) dedicado a manejar colas de trabajos con BullMQ (procesamiento en background, IA pesada, tareas de mantenimiento).
3. **Servicios de Apoyo (Infra)**:
   - **PostgreSQL (pgvector)**: Almacena datos relacionales y vectores espaciales (1536 dimensiones) para búsquedas semánticas.
   - **Redis**: Gestiona las colas de BullMQ y funciona como caché rápido.

### Estructura de Directorios (`src/`)

El proyecto sigue una arquitectura modular y orientada a dominios (Feature Modules):

- 📁 **`core/`**: Configuraciones críticas, conexión a base de datos (Prisma) y módulo base.
- 📁 **`features/`**: Donde reside la lógica de negocio.
  - 🔹 `auth/`: Autenticación y Guards (JWT).
  - 🔹 `users/`: Gestión de usuarios (Estudiantes, Profesores, Admins).
  - 🔹 `modules/`: Cursos, configuración de IA asociada y métricas.
  - 🔹 `pages/`: El núcleo de contenido. Lecciones con bloques estructurados e incrustación de vectores.
  - 🔹 `interactions/`: Actividades evaluativas (Quizzes, T/F, emparejamiento) y rastreo de visualización.
  - 🔹 `chat/`: Interfaz conversacional entre el estudiante y el asistente de IA.
  - 🔹 `content-generation/`: Motor de IA generativa (OpenAI) para crear lecciones usando prompts controlados y configuraciones modulares (Audiencia, Tono, Nivel).
- 📁 **`providers/`**: Servicios externos e inyección (Manejo de Archivos locales/nube, Conector base de IA).
- 📁 **`shared/`**: Filtros de excepciones, Interceptores, utilidades, constantes y DTOs globales (paginación, respuestas base).

---

## 🗄️ 3. Modelo de Datos (Prisma)

El archivo `prisma/schema.prisma` define un dominio robusto. A continuación, las entidades clave:

- **Usuarios (`User`)**: Incluye roles (`ADMIN`, `TEACHER`, `STUDENT`) e integración con `microsoft_id`.
- **Módulos (`Module`)**: Representan cursos. Tienen una configuración específica de IA (`AiConfiguration`) que define cómo se genera el contenido para ese curso (nivel básico/intermedio/avanzado, tono formal/casual, etc.).
- **Páginas (`Page` y `Block`)**: Representan lecciones. Tienen soporte de `vector(1536)` para embeddings semánticos. Están divididas en unidades de bloques lógicos (`BlockType`: Texto, Código, Imágenes), lo que facilita que la IA construya el JSON del contenido de forma enriquecida y modular (TipTap).
- **Interacciones y Foros**:
  - `Activity` y `ActivityAttempt`: Exámenes interactivos (opción múltiple, completar, verdadero/falso).
  - `PageView`: Métrica temporal sobre cuánto tiempo el estudiante gasta viendo una página.
- **Componentes de IA y Chat**:
  - `Session` y `Message`: Almacenan el contexto del chat.
  - `AiConfiguration`: Establece las reglas del sistema para responder.
  - `Prompt`, `PageFeedback`, `Note`: Registro de las interacciones generativas.

---

## 🧠 4. Flujos Clave de la Plataforma

1. **Generación de Contenido con IA**
   - El profesor configura el módulo (Ej: Tono educativo, universitario).
   - Llama a los endpoints en `content-generation`.
   - El servicio se comunica de manera estricta (usando Validadores de Schema de IA, probablemente `zod`) asegurando que el LLM retorne formatos JSON predeterminados.
   - El contenido se ensambla como registros `Block` conectados a `Page`.

2. **Relaciones Semánticas (RAG)**
   - Gracias a la base `pgvector`, las páginas cuentan con representaciones vectoriales (`embedding`). El sistema calcula automáticamente relaciones (Prerrequisitos, Conceptos complementarios) entre lecciones.
3. **Cargas de Trabajo Asíncronas (Workers)**
   - Para evitar bloquear los peticiones HTTP con tiempos largos respuesta de OpenAI o tareas de encolamiento masivo de notificaciones, Nest usa `@nestjs/bullmq` para derivar estos procesos al contenedor "worker".

---

## 🛠️ 5. Flujo de Desarrollo (Dev Workflow)

### Ejecución Local

1. Levanta los contenedores de base de datos y Redis:
   ```bash
   docker compose -f docker-compose-dev.yaml up -d
   ```
2. Aplica el esquema de prisma (sin necesidad de crear archivo de migración si estás iterando en DB local, o usa `db:migrate` para migraciones formales):
   ```bash
   pnpm exec prisma db push
   ```
   _(También puedes poblar la base ejecutando `pnpm db:seed`)_
3. Inicia el servidor de API en modo watch:
   ```bash
   pnpm dev
   ```

### Archivos Docker Críticos

- **`docker-compose-dev.yaml`**: Arranca solo dependencias DB (Postgres) y Cache (Redis) para desarrollo ágil con node local.
- **`docker-compose-local.yaml`**: Emula un stack completo incluyendo el contenedor API y el Worker. Útil para probar interacciones entre microservicios.
- **`docker-compose-prod.yaml`**: Contiene la definición y punto de montaje de la imagen hacia GHCR (GitHub Container Registry).
- **`docker-entrypoint.sh`**: Ejecuta automatizadamente `prisma migrate deploy` asegurando la sincronización de la DB cada vez que la imagen principal levanta en despliegues.
- **`Dockerfile`**: Optimizado con estrategia **Multi-stage build**:
  1. Instala dependencias (`deps`)
  2. Compila NestJS (`builder`)
  3. Copia solo los compilados minimizando el peso de la imagen (`runner`).

### Seguridad y Restricciones

- Todos los endpoints de la API están protegidos mediante JWT (vía `JwtAuthGuard` invocado globalmente en el `AppModule`).
- Los payloads pasan automáticamente a través del `ValidationPipe` (`whitelist: true`) rechazando propiedades no explícitas.

---

**📍 Nota Final para el Desarrollador:** Si tienes dudas sobre cómo interactuar, testea la API accediendo a `http://localhost:<PUERTO>/api/docs` (Swagger) una vez que inicies el servidor de desarrollo.
