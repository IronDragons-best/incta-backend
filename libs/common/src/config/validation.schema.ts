import Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

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
});

export const loggerValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test'),

  LOGGER_LEVEL: Joi.string().valid('info', 'trace', 'error'),
});

export const filesValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test'),

  FILES_HOST: Joi.string(),

  FILES_PORT: Joi.number(),
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
