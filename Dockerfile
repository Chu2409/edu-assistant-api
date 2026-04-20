FROM node:24-bookworm-slim AS deps

WORKDIR /app
RUN sed -i 's|deb.debian.org|cloudfront.debian.net|g' /etc/apt/sources.list.d/debian.sources
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    rm -f /etc/apt/apt.conf.d/docker-clean && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential cmake python3 git

COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN --mount=type=cache,target=/root/.npm \
    npm ci

FROM deps AS whisper-build
RUN cd node_modules/nodejs-whisper/cpp/whisper.cpp && \
    cmake -B build -DGGML_NATIVE=OFF -DCMAKE_BUILD_TYPE=Release && \
    cmake --build build --config Release -j "$(nproc)"

FROM whisper-build AS build
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY prisma.config.ts ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN sed -i 's|deb.debian.org|cloudfront.debian.net|g' /etc/apt/sources.list.d/debian.sources
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    rm -f /etc/apt/apt.conf.d/docker-clean && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
        ffmpeg libgomp1 dumb-init ca-certificates curl python3 && \
    curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/false -M nodeuser

COPY --from=build --chown=nodeuser:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nodeuser:nodejs /app/dist ./dist
COPY --from=build --chown=nodeuser:nodejs /app/package.json ./
COPY --from=build --chown=nodeuser:nodejs /app/prisma ./prisma
COPY --from=build --chown=nodeuser:nodejs /app/prisma.config.ts ./prisma.config.ts

USER nodeuser
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/main"]
