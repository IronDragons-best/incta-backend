
'use strict';
// для dev окружения берем из файлика. если нет файлика будет скип и возьмет из окружения
const fs = require('fs');
const dotenv = require('dotenv');

const localEnvPath = './env/.env.development.local';
const defaultEnvPath = './env/.env.development';

if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
} else {
  dotenv.config({ path: defaultEnvPath });
}

console.log(process.env.NODE_ENV);
exports.config = {
  app_name: [process.env.NEW_RELIC_APP_NAME],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,

  logging: {
    level: process.env.NEW_RELIC_LOG_LEVEL || 'info',
    filepath: 'stdout'
  },

  distributed_tracing: {
    enabled: true
  },

  agent_enabled: process.env.NODE_ENV !== 'test',

  application_logging: {
    enabled: process.env.NEW_RELIC_ENABLED === 'true',
    forwarding: {
      enabled: process.env.NEW_RELIC_LOG_FORWARDING === 'true',
      max_samples_stored: 10000
    },
    metrics: {
      enabled: true
    },
    local_decorating: {
      enabled: true
    }
  },

  rules: {
    ignore: ['^/health', '^/metrics']
  }
};
