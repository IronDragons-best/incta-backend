FROM node:20.11-alpine
ARG port
ARG service
ENV SERVICE=$service
ENV PORT=$port

USER node
RUN mkdir -p /home/node/dist/${SERVICE}
WORKDIR /home/node/dist/${SERVICE}

# Устанавливаем pnpm глобально
RUN npm install -g pnpm

# Копируем package.json и pnpm-lock.yaml
COPY --chown=node package*.json ./
COPY --chown=node pnpm-lock.yaml ./

# Устанавливаем зависимости
RUN pnpm install --frozen-lockfile

# Устанавливаем конкретную версию Prisma CLI
RUN pnpm add prisma@latest --save-dev

# Копируем весь код
COPY --chown=node . .
COPY --chown=node newrelic.js ./

# Генерируем Prisma Client ПОСЛЕ копирования схемы
RUN pnpm prisma generate --schema=apps/files-service/prisma/schema.prisma

# Собираем приложение
RUN npm run build:${SERVICE}

# Удаляем Prisma CLI для уменьшения размера образа
RUN pnpm remove prisma

EXPOSE ${PORT}
CMD npm run 'start:files-service'