# Stage 1: Builder
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

ARG VITE_AI_SERVICE_BASE_URL
ARG VITE_NEON_AUTH_URL
ENV VITE_AI_SERVICE_BASE_URL=$VITE_AI_SERVICE_BASE_URL
ENV VITE_NEON_AUTH_URL=$VITE_NEON_AUTH_URL

COPY . .
RUN npm run build

# Stage 2: Runner
FROM node:24-alpine AS runner

WORKDIR /app

COPY --from=builder /app/.output ./.output

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
