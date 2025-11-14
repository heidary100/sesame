import {
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

/**
 * Custom decorator to validate a string against the 'YYYY-MM-DD HH:MM'
 * or 'YYYY-MM-DD HH:MM:SS' format.
 * @param format The required date-time format.
 * @param validationOptions Options passed to class-validator.
 */
export function IsDateTimeString(
  format: 'YYYY-MM-DD HH:MM' | 'YYYY-MM-DD HH:MM:SS',
  validationOptions?: ValidationOptions,
) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'isDateTimeString',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;
          // Regex for YYYY-MM-DD HH:MM
          const regexShort = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
          // Regex for YYYY-MM-DD HH:MM:SS
          const regexLong = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
          
          const isValid = format === 'YYYY-MM-DD HH:MM'
            ? regexShort.test(value)
            : regexLong.test(value);
          
          // Also validate that the string represents a valid date when parsed
          if (isValid) {
            const date = new Date(value);
            return !isNaN(date.getTime());
          }
          
          return isValid;
        },
        defaultMessage() {
          return `${propertyName} must be a string in the format ${format}`;
        },
      },
    });
  };
}