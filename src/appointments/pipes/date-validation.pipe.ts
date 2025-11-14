import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class DateValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype) return value;

    const object = plainToInstance(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      throw new BadRequestException(
        errors
          .map((e) =>
            e.constraints ? Object.values(e.constraints).join(', ') : '',
          )
          .filter(Boolean)
          .join('; '),
      );
    }

    const { start, end } = object;

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (endDate <= startDate) {
      throw new BadRequestException('end must be after start');
    }

    return object;
  }
}
