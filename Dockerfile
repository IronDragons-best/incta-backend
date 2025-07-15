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

# Build all services
RUN pnpm run build:gd-main-app
RUN pnpm run build:files-service
RUN pnpm run build:notification-service

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

# Copy built applications (dist folder)
COPY --from=builder /app/dist ./dist

# Copy necessary source directories and config files from the builder stage
# These are needed for TypeORM CLI (typeorm.config.ts, migrations, entities)
# and for other potential runtime needs (e.g., dynamic imports, shared libs)
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/libs ./libs
COPY --from=builder /app/tsconfig*.json ./
COPY --from=builder /app/nest-cli.json ./

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
EXPOSE 3000 3001 3002

# Use dumb-init as the entrypoint to handle signals gracefully
ENTRYPOINT ["dumb-init", "--"]

# Define the default command to run when the container starts
CMD ["/bin/sh", "-c", "chmod +x /app/start-services.sh && /app/start-services.sh"]