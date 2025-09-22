# Check out https://hub.docker.com/_/node to select a new base image
FROM node:20.11-alpine
ARG port
ARG service
ENV SERVICE=$service
ENV PORT=$port

# Set to a non-root built-in user `node`
USER node

# Create app directory (with user `node`)
RUN mkdir -p /home/node/dist/${SERVICE}

WORKDIR /home/node/dist/${SERVICE}

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY --chown=node package*.json ./

# Копируем New Relic конфиг
COPY --chown=node newrelic.js ./

RUN npm install

RUN npm install prisma@6.12.0 --save-dev

# Bundle app source code
COPY --chown=node . .

# Generate Prisma client (after copying all code including schema)
RUN npx prisma generate --schema=apps/files-service/prisma/schema.prisma

# Build the service
RUN npm run build:${SERVICE}

# Remove prisma CLI after build to keep image smaller
RUN npm remove prisma

# Bind to all network interfaces so that it can be mapped to the host OS
EXPOSE ${PORT}

CMD npm run 'start:files-service'