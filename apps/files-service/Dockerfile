FROM node:20.11-alpine
ARG port
ARG service
ENV SERVICE=$service
ENV PORT=$port

USER node
RUN mkdir -p /home/node/dist/${SERVICE}
WORKDIR /home/node/dist/${SERVICE}

# Сначала копируем package.json
COPY --chown=node package*.json ./
COPY --chown=node yarn.lock ./

# Устанавливаем зависимости
RUN yarn install --frozen-lockfile

# Устанавливаем конкретную версию Prisma CLI
RUN yarn add prisma@latest --dev

# Копируем весь код
COPY --chown=node . .
COPY --chown=node newrelic.js ./

# Генерируем Prisma Client ПОСЛЕ копирования схемы
RUN yarn prisma generate --schema=apps/files-service/prisma/schema.prisma

# Собираем приложение
RUN npm run build:${SERVICE}

# Удаляем Prisma CLI для уменьшения размера образа
RUN yarn remove prisma

EXPOSE ${PORT}
CMD npm run 'start:files-service'
