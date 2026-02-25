# Stage 1: Builder
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

ARG VITE_NEON_AUTH_URL

COPY . .
RUN npm run build

# Stage 2: Runner
FROM node:24-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs appuser

COPY --from=builder /app/.output ./.output

ENV NODE_ENV=production

USER appuser

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
