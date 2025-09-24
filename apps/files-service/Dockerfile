FROM node:20.11-alpine
ARG port
ARG service
ENV SERVICE=$service
ENV PORT=$port

# Устанавливаем pnpm глобально КАК ROOT
RUN npm install -g pnpm

# Переключаемся на пользователя node
USER node
RUN mkdir -p /home/node/dist/${SERVICE}
WORKDIR /home/node/dist/${SERVICE}

# Копируем package.json и pnpm-lock.yaml
COPY --chown=node package*.json ./
COPY --chown=node pnpm-lock.yaml ./

# Устанавливаем зависимости
RUN pnpm install --frozen-lockfile

# Копируем весь код
COPY --chown=node . .

# Собираем приложение
RUN npm run build:${SERVICE}

EXPOSE ${PORT}
CMD npm run 'start:files-service'