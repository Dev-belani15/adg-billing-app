# Multi-stage production Dockerfile for Zyden Retail ERP & POS (ADG)
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
ENV NODE_ENV=production

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma Client for the container target
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Runner stage
FROM base AS runner
WORKDIR /app
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Copy Next.js standalone build & static files
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
