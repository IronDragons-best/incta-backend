FROM node:18-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build:gd-main-app
RUN pnpm run build:files-service
RUN pnpm run build:notification-service

FROM node:18-alpine AS production

WORKDIR /app

RUN apk add --no-cache dumb-init

RUN npm install -g pnpm

COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist


COPY --from=builder /app/apps ./apps
COPY --from=builder /app/libs ./libs
COPY --from=builder /app/tsconfig*.json ./
COPY --from=builder /app/nest-cli.json ./

COPY start-services.sh ./start-services.sh

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3000 3001 3002

ENTRYPOINT ["dumb-init", "--"]

CMD ["/bin/sh", "-c", "chmod +x /app/start-services.sh && /app/start-services.sh"]