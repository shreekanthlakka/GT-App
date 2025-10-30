# apps/ocr/Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY apps/ocr/package.json ./apps/ocr/
COPY packages/common/package.json ./packages/common/
COPY packages/common-backend/package.json ./packages/common-backend/
COPY packages/db/package.json ./packages/db/
COPY packages/typescript-config/package.json ./packages/typescript-config/

# Install dependencies
RUN npm ci

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate --schema=./packages/db/prisma/schema.prisma

# Build the OCR service and its dependencies
RUN npm run build --workspace=packages/common
RUN npm run build --workspace=packages/common-backend
RUN npm run build --workspace=packages/db
RUN npm run build --workspace=apps/ocr

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# Copy built application
COPY --from=builder --chown=expressjs:nodejs /app/apps/ocr/dist ./dist
COPY --from=builder --chown=expressjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=expressjs:nodejs /app/packages ./packages
COPY --from=builder --chown=expressjs:nodejs /app/apps/ocr/package.json ./package.json

USER expressjs

EXPOSE 3003

CMD ["node", "dist/index.js"]
