import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsDateDMY(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isDateDMY',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return true;
          const match = /^\d{2}\.\d{2}\.\d{4}$/.exec(value);
          if (!match) return false;
          const [day, month, year] = value.split('.').map(Number);
          const date = new Date(year, month - 1, day);
          return (
            date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day &&
            date <= new Date()
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid date in dd.mm.yyyy format`;
        },
      },
    });
  };
}
