# Opción B: Redis para Límite Diario de Emails

## Flujo Completo

```
Usuario pide enviar email
        ↓
   ┌────────────────────┐
   │  ¿Hay conexión     │ ← Si Redis no disponible
   │  Redis activa?     │
   └─────────┬──────────┘
             ↓
   ┌────────────────────┐
   │ canSendEmail()     │ ← Script Lua atómico
   │ ¿count < 1000?     │
   └─────────┬──────────┘
             │
    ┌────────┴────────┐
    │                 │
   SÍ                NO
    │                 │
    ↓                 ↓
┌────────┐    ┌─────────────────┐
│ Enviar  │    │ Encolar para    │
│ email   │    │ mañana (retry)  │
└────────┘    └─────────────────┘
```

---

## 1. Script Lua Atómico (ejecutado en Redis)

```lua
-- email_limit.lua
-- KEYS[1] = key del día (ej: email:daily:2026-05-01)
-- ARGV[1] = límite (1000)
-- ARGV[2] = TTL en segundos (86400 = 24h)

local current = redis.call('GET', KEYS[1])
current = (current and tonumber(current)) or 0

if current >= tonumber(ARGV[1]) then
    return 0  -- límite alcanzado
end

local newCount = redis.call('INCR', KEYS[1])

if newCount == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[2])
end

return 1  -- puede enviar
```

### ¿Por qué Lua?
- Ejecuta **atómicamente** — ninguna otra operación puede interferir entre el GET y el INCR
- Elimina race conditions sin necesidad de transacciones
- Más rápido que transacciones WATCH/MULTI/EXEC

---

## 2. Código TypeScript

```typescript
// services/emailLimitService.ts

const LIMIT = 1000;

const SEND_EMAIL_SCRIPT = `
  local key = KEYS[1]
  local limit = tonumber(ARGV[1])
  local ttl = tonumber(ARGV[2])

  local current = redis.call('GET', key)
  current = (current and tonumber(current)) or 0

  if current >= limit then
    return 0
  end

  local newCount = redis.call('INCR', key)
  if newCount == 1 then
    redis.call('EXPIRE', key, ttl)
  end

  return 1
`;

async function canSendEmail(redis: Redis): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const key = `email:daily:${today}`;

  const result = await redis.eval(SEND_EMAIL_SCRIPT, 1, key, LIMIT, 86400);
  return result === 1;
}

async function sendEmailWithLimit(
  redis: Redis,
  emailQueue: Queue,
  emailData: { to: string; subject: string; body: string }
): Promise<{ sent: boolean; queued: boolean }> {

  const canSend = await canSendEmail(redis);

  if (canSend) {
    await actuallySendEmail(emailData);
    return { sent: true, queued: false };
  }

  // Límite alcanzado → encolar para mañana
  await emailQueue.add('send-email', emailData, {
    scheduledFor: getNextDayMorning(), // Mañana 9:00 AM
    retry: {
      maxAttempts: 3,
      backoff: { type: 'exponential', delay: 60000 }
    }
  });

  return { sent: false, queued: true };
}
```

---

## 3. Worker Nocturno (procesa cola)

```typescript
// workers/dailyEmailWorker.ts

// Se ejecuta cada día a las 00:01
cron.schedule('1 0 * * *', async () => {
  const today = new Date().toISOString().split('T')[0];

  // Limpiar key del día anterior (ya no se necesita)
  const yesterday = getYesterday(); // "2026-04-30"
  await redis.del(`email:daily:${yesterday}`);

  // Procesar cola de emails encolados para hoy
  const pendingEmails = await emailQueue.getPending({ scheduledFor: today });

  for (const job of pendingEmails) {
    const canSend = await canSendEmail(redis);
    if (canSend) {
      await actuallySendEmail(job.data);
      await job.complete();
    }
  }
});
```

---

## Ejemplo del Timing

| Hora | Evento | Contador |
|------|--------|----------|
| Día 1 - 8:00 AM | Llega email → se envía | 1 |
| Día 1 - 9:00 AM | Llegan 999 emails → todos se envían | 1000 |
| Día 1 - 10:00 AM | Llega 1 email → NO se envía, se encola | 1000 |
| Día 2 - 00:01 | Reset contador, procesa cola | 0 |
| Día 2 - 9:00 AM | Email encolado se envía | 1 |

---

## Escenarios de Comportamiento

| Escenario | Qué pasa |
|-----------|----------|
| 1500 emails necesitan envío | 1000 se envían hoy, 500 se encolan para mañana |
| Hay cola de ayer | Se procesan primero antes de nuevos emails |
| Email falla | Se reintenta 3 veces con backoff exponencial |
| Cola masiva | Se respeta el límite de 1000 diarios siempre |

---

## Ventajas de Esta Aproximación

1. **Garantía de límite** — nunca se supera 1000
2. **Resiliencia** — si el email falla, se reintenta
3. **Fairness** — emails antiguos se procesan primero (FIFO)
4. **Visibilidad** — puedes monitorear cola de espera
5. **Atomicidad** — el script Lua evita race conditions sin transacciones

---

## Estructura de Datos en Redis

| Key | Value | TTL |
|-----|-------|-----|
| `email:daily:2026-05-01` | `847` | 24h (se auto-expira) |

El contador crece con INCR y expira automáticamente. No necesitas limpiar manualmente (solo el día anterior por auditoría).

---

## Notas de Implementación

- El **TTL de 24h** se settea solo en el primer INCR del día
- Si Redis cae, el límite no se aplica (graceful degradation — permitir envío con logging)
- Considerar agregar métricas: `email.daily.sent`, `email.daily.queued`, `email.daily.rejected`