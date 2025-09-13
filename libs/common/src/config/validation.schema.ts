import Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  DEP_TYPE: Joi.string(),

  PORT: Joi.number().port().default(3000),

  FILES_HOST: Joi.string(),

  FILES_PORT: Joi.number(),

  NOTIFICATION_HOST: Joi.string(),

  NOTIFICATION_PORT: Joi.number(),

  RABBITMQ_HOST: Joi.string(),

  PG_HOST: Joi.string().required(),

  MAIN_PG_DATABASE: Joi.string().required(),

  PG_USER: Joi.string().required(),

  PG_PASSWORD: Joi.string().required(),

  PG_PORT: Joi.number().port(),

  PRODUCTION_URL: Joi.string(),

  JWT_ACCESS_SECRET: Joi.string(),
  JWT_ACCESS_EXPIRE: Joi.string(),
  JWT_REFRESH_SECRET: Joi.string(),
  JWT_REFRESH_EXPIRE: Joi.string(),

  // OAUTH2
  GOOGLE_CLIENT_ID: Joi.string(),
  GOOGLE_CLIENT_SECRET: Joi.string(),
  GOOGLE_CALLBACK_URL: Joi.string(),
  GITHUB_CLIENT_ID: Joi.string(),
  GITHUB_CLIENT_SECRET: Joi.string(),
  GITHUB_CALLBACK_URL: Joi.string(),

  PAYMENTS_MONGO_URL: Joi.string(),
  PAYMENT_PRODUCT_ID: Joi.string(),
  PAYMENT_PRICE_ID: Joi.string(),
  PAYMENT_SECRET_KEY: Joi.string(),
  PAYMENT_WEBHOOK_SIGN_SECRET: Joi.string(),
  PAYMENT_WEBHOOK_URL: Joi.string(),
  PAYMENTS_SERVICE_PORT: Joi.number().port(),
  PAYMENTS_SERVICE_HOST: Joi.string(),
});

export const loggerValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test'),

  LOGGER_LEVEL: Joi.string().valid('info', 'trace', 'error'),

  NEW_RELIC_APP_NAME: Joi.string(),

  NEW_RELIC_LICENSE_KEY: Joi.string(),

  NEW_RELIC_LOG_LEVEL: Joi.string(),

  NEW_RELIC_ENABLED: Joi.boolean(),

  NEW_RELIC_LOG_FORWARDING: Joi.boolean(),
});

export const filesValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test'),

  FILES_HOST: Joi.string(),

  FILES_PORT: Joi.number(),

  S3_URL: Joi.string(),

  S3_ACCESS_SECRET_KEY: Joi.string(),

  S3_ACCESS_KEY_ID: Joi.string(),

  S3_SERVER: Joi.string(),

  S3_REGION: Joi.string(),

  POST_FILES_BUCKET_NAME: Joi.string(),
});

export const notificationsValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test'),

  NOTIFICATION_HOST: Joi.string(),

  NOTIFICATION_PORT: Joi.number().port(),

  NOTIFICATION_EMAIL_HOST: Joi.string(),

  NOTIFICATION_SENDER_ADDRESS: Joi.string().email(),

  NOTIFICATION_SENDER_PASSWORD: Joi.string(),

  RABBITMQ_HOST: Joi.string(),

  RABBITMQ_PORT: Joi.number().port(),
});

export const monitoringValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test'),

  PAYMENTS_MONGO_URL: Joi.string(),

  PAYMENT_PRODUCT_ID: Joi.string(),

  PAYMENT_PRICE_ID: Joi.string(),

  PAYMENT_SECRET_KEY: Joi.string(),

  PAYMENT_WEBHOOK_SIGN_SECRET: Joi.string(),

  PAYMENT_WEBHOOK_URL: Joi.string(),

  PAYMENTS_SERVICE_PORT: Joi.number().port(),

  PAYMENTS_SERVICE_HOST: Joi.string(),
});
