import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsDateAfter(property: string, validationOptions?: ValidationOptions) {
  return (object: Record<string, any>, propertyName: string) => {
    registerDecorator({
      name: 'IsDateAfter',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          
          // Handle both string dates and Date objects
          let valueDate: Date;
          let relatedDate: Date;
          
          if (typeof value === 'string') {
            valueDate = new Date(value);
          } else if (value instanceof Date) {
            valueDate = value;
          } else {
            return false;
          }
          
          if (typeof relatedValue === 'string') {
            relatedDate = new Date(relatedValue);
          } else if (relatedValue instanceof Date) {
            relatedDate = relatedValue;
          } else {
            return false;
          }
          
          return valueDate.getTime() > relatedDate.getTime();
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `${args.property} must be later than ${relatedPropertyName}`;
        },
      },
    });
  };
}