# Multi-stage build for NestJS monorepo
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build all services
RUN npm run build:gd-main-app
RUN npm run build:files-service
RUN npm run build:notification-service

# Production image
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

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