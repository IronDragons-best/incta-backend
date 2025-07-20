import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { ConfigService } from '@nestjs/config';

export function IsCaptchaRequired(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isCaptchaRequired',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          const config = new ConfigService();
          const isEnabled = config.get('RECAPTCHA_ENABLED') !== 'false';
          if (!isEnabled) return true;
          return typeof value === 'string' && value.trim().length > 0;
        },
        defaultMessage() {
          return `captchaToken is required`;
        },
      },
    });
  };
}