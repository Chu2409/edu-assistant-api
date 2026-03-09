# ─────────────────────────────────────────
# Stage 1: Install dependencies
# ─────────────────────────────────────────
FROM node:24-alpine AS deps

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --frozen-lockfile

# ─────────────────────────────────────────
# Stage 2: Build
# ─────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ─────────────────────────────────────────
# Stage 3: Production image
# ─────────────────────────────────────────
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install only production deps
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./prisma.config.ts

RUN npm ci --frozen-lockfile --omit=dev

# Copy compiled output
COPY --from=builder /app/dist ./dist

# The default command is overridden per-service in docker-compose
CMD ["node", "dist/src/main"]