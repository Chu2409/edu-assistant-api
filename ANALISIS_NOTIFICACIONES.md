> Para implementar notificaciones por correo institucional de Microsoft en un entorno educativo, lo ideal es usar Microsoft Graph API. Olvidate de SMTP tradicional (user/pass); Microsoft está deprecando la autenticación básica y lo que se usa hoy es OAuth 2.0.

Vamos con el análisis detallado:

### 1. El Motor: Microsoft Graph API vs SMTP
Para cuentas institucionales, la mejor opción es Microsoft Graph.
* **Por qué:** Es más seguro, permite enviar correos "en nombre de" una cuenta de sistema sin exponer credenciales y tiene mejores límites de envío para entornos empresariales/educativos.
* **Implementación:** Necesitás registrar una aplicación en Azure Portal (Microsoft Entra ID) con permisos de `Mail.Send`.

### 2. Consideraciones de Licencia y Costos
* **Licencia de Microsoft 365:** La institución ya debe tener licencias (A1, A3 o A5 para educación). El envío de correos vía API consume los límites de la cuenta que envía (normalmente 10,000 destinatarios por día por usuario, pero ojo con el spam).
* **Azure Subscription:** Registrar la App en Azure es gratis, pero el tráfico de Graph API tiene cuotas de "throttling" (velocidad). Para un volumen normal de una plataforma educativa, no deberías pagar extras.
* **Hardware:** No necesitás hardware extra. Todo corre en la nube de Microsoft. Tu servidor NestJS solo hace llamadas REST (HTTPS).

### 3. Implementación Técnica (El "Cómo")

#### A. Infraestructura en Azure
1. **App Registration:** Crear una aplicación en Azure.
2. **Permisos de Aplicación (Client Credentials Flow):** Si las notificaciones son automáticas (sin que un usuario esté logueado), usás `Mail.Send` con permisos de aplicación.
3. **Secretos:** Necesitás el Tenant ID, Client ID y Client Secret.

#### B. Arquitectura en el Backend (NestJS)
Dado que ya tenés un `worker.module.ts` y usás BullMQ (según vi en los archivos), esta es la estructura recomendada:

1. **Queue de Notificaciones:** No envíes el mail en el mismo request que crea el Learning Object. Ponelo en una cola (`notifications-queue`).
2. **Cron Jobs:** Para el reporte semanal, usaremos `@nestjs/schedule` para disparar el proceso que analiza las interacciones y genera el resumen.
3. **Generación de Contenido AI:** Usarás los datos de interactions y el servicio de AI que ya tenés para armar las "sugerencias" personalizadas.

---

### Análisis de Requerimientos Específicos

| Evento | Origen | Lógica |
| :--- | :--- | :--- |
| **Nuevo LO** | `LearningObjectService.create` | Dispara un evento que busca a todos los alumnos enrolados en ese módulo y encola el envío. |
| **Reporte Semanal** | Cron Job (Lunes 8 AM) | Consulta Interactions, calcula `time_of_use`, pide a la AI sugerencias basadas en el histórico y envía. |

### Riesgos y Consideraciones de "Institutional Mail"
1. **Spam Filters:** Los correos institucionales son muy estrictos. Si mandás 500 mails de golpe, Microsoft te puede bloquear la cuenta. Necesitás implementar un "Backoff" (reintentos con delay) en tus workers.
2. **Privacidad:** Para las sugerencias personalizadas, la AI va a procesar datos de interacción del alumno. Hay que asegurar que solo se use la data necesaria.
3. **Template Engine:** Necesitás algo como EJS o Handlebars para que los mails se vean profesionales (con el logo de la institución, etc.).

---

### ¿Por dónde querés arrancar?
1. ¿Querés que busquemos si ya hay alguna configuración de Microsoft que podamos reutilizar (vi que tenés `microsoft.strategy.ts`)?
2. ¿O querés que diseñemos el esquema de datos para trackear quién quiere notificaciones semanales?

> (Dato: vi que ya tenés un `worker.ts` en el root de src, eso nos va a servir mucho para no bloquear el API principal).