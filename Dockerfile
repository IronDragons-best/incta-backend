# Multi-stage build for NestJS monorepo
FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install ALL dependencies (нужны dev зависимости для сборки)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build all services
RUN pnpm run build:gd-main-app
RUN pnpm run build:files-service
RUN pnpm run build:notification-service

# Production image
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Install pnpm
RUN npm install -g pnpm

# Copy package files and install production dependencies
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Copy built applications
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/apps ./apps

# Copy startup script
COPY start-services.sh ./start-services.sh

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose ports
EXPOSE 3000 3001 3002

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]