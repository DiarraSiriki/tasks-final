# Étape 1 : build
FROM oven/bun:1 AS builder
WORKDIR /app

# Dépendances (le projet utilise bun.lock, pas bun.lockb)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Code source
COPY . .

# Variables lues au moment du build par Vite
ARG VITE_API_URL=
ARG VITE_PROXY_TARGET=http://backend:3000
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_PROXY_TARGET=${VITE_PROXY_TARGET}

RUN bun run build

# Étape 2 : exécution
FROM oven/bun:1 AS runner
WORKDIR /app

# Le serveur `vite preview` a besoin de la config (proxy + port) et des
# dépendances de développement (vite, plugins).
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json /app/bun.lock ./
COPY --from=builder /app/vite.config.ts ./
RUN bun install --frozen-lockfile

ENV NODE_ENV=production

EXPOSE 5173

CMD ["bun", "run", "preview"]
