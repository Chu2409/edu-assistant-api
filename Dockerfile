# ============================================
# Stage 1: Dependencies & Build
# ============================================
FROM node:24-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./
COPY .npmrc* ./

# Instalar todas las dependencias (incluyendo devDependencies para el build)
RUN npm ci

# Copiar código fuente y Prisma
COPY . .

# Generar cliente Prisma (Prisma 7.4 → output en src/core/database/generated)
# DB_URL es requerido por prisma.config.ts pero no se usa en generate (solo placeholder)
ENV DB_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate

# Build de la aplicación (compila main.ts y worker.ts)
RUN npm run build

# ============================================
# Stage 2: Production
# ============================================
FROM node:24-alpine AS production

WORKDIR /app

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./
COPY .npmrc* ./

# Instalar solo dependencias de producción
RUN npm ci --omit=dev && npm cache clean --force

# Copiar Prisma schema, config y generar cliente
COPY prisma ./prisma/
COPY prisma.config.ts ./
# DB_URL placeholder para generate (la URL real se usa en runtime)
ENV DB_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate

# Copiar build desde builder
COPY --from=builder /app/dist ./dist

# Copiar script de entrypoint para la API
COPY docker-entrypoint.sh /usr/local/bin/
# Corregir CRLF (Windows) a LF para que funcione en Linux
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh && chmod +x /usr/local/bin/docker-entrypoint.sh

# Cambiar ownership
RUN chown -R nestjs:nodejs /app

USER nestjs

# Puerto por defecto
EXPOSE 3000

# Comando por defecto (API) - puede ser sobrescrito en docker-compose
CMD ["node", "dist/src/main.js"]
