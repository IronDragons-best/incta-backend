FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm globally in the builder stage
RUN npm install -g pnpm

# Copy package files (including pnpm-lock.yaml for reproducible builds)
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install ALL dependencies (dev dependencies are needed for building)
RUN pnpm install --frozen-lockfile

# Copy the entire source code to the builder stage
COPY . .

# Generate Prisma client BEFORE building the services
RUN pnpm prisma generate --schema=apps/files-service/prisma/schema.prisma

# Build all services (files-service build also includes prisma generate)
RUN pnpm run build:gd-main-app
RUN pnpm run build:files-service
RUN pnpm run build:notification-service
RUN pnpm run build:payments-service

# Verify Prisma client was generated
RUN ls -la node_modules/.prisma/client/ || echo "Prisma client not found!"

FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Install pnpm globally in the production stage
RUN npm install -g pnpm

# Copy package files (including pnpm-lock.yaml) for production dependencies
COPY package.json ./
COPY pnpm-lock.yaml ./

# Install ONLY production dependencies
RUN pnpm install --frozen-lockfile --prod

# IMPORTANT: Copy Prisma schema BEFORE generating client in production
COPY --from=builder /app/apps/files-service/prisma ./apps/files-service/prisma

# Copy the generated Prisma Client from the builder stage
COPY --from=builder /app/node_modules/.prisma/client/ ./node_modules/.prisma/client/

# Copy built applications (dist folder)
COPY --from=builder /app/dist ./dist

# Copy necessary source directories and config files from the builder stage
# These are needed for TypeORM CLI (typeorm.config.ts, migrations, entities)
# and for other potential runtime needs (e.g., dynamic imports, shared libs)
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/libs ./libs
COPY --from=builder /app/tsconfig*.json ./
COPY --from=builder /app/nest-cli.json ./

# Copy the New Relic configuration file
COPY newrelic.js ./

# Copy the startup script
COPY start-services.sh ./start-services.sh



# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership of the app directory to the non-root user
RUN chown -R nestjs:nodejs /app

# Switch to the non-root user
USER nestjs

# Expose ports for the services
EXPOSE 3000 3001 3002 3003

# Use dumb-init as the entrypoint to handle signals gracefully
ENTRYPOINT ["dumb-init", "--"]

# Define the default command to run when the container starts
CMD ["/bin/sh", "-c", "chmod +x /app/start-services.sh && /app/start-services.sh"]
