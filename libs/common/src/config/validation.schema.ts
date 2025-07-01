import Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

  PORT: Joi.number().port().default(3000),

  FILES_HOST: Joi.string(),

  FILES_PORT: Joi.number(),

  PG_HOST: Joi.string().required(),

  MAIN_PG_DATABASE: Joi.string().required(),

  PG_USER: Joi.string().required(),

  PG_PASSWORD: Joi.string().required(),

  PG_PORT: Joi.number().port(),

  FRONTEND_URL: Joi.string(),
});

export const loggerValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test'),

  LOGGER_LEVEL: Joi.string().valid('info', 'trace', 'error'),
});
