import {
  IsInt,
  IsDefined,
  IsPositive,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsDateTimeString } from '../../common/validators/is-date-time-string.decorator';
import { IsDateAfter } from '../../common/validators/is-date-after.decorator';

export class CreateAppointmentDto {
  @ApiProperty({ example: 1 })
  @IsDefined()
  @IsInt()
  @IsPositive({ message: 'id must be a positive number.' })
  id: number;

  @ApiProperty({ example: '2020-10-10 20:20' })
  @Transform(({ value }: TransformFnParams) => {
    if (typeof value === 'string') {
      return value;
    }
    return value;
  })
  @IsDateTimeString('YYYY-MM-DD HH:MM', {
    message: 'start date must be in the format YYYY-MM-DD HH:MM.',
  })
  start: string;

  @ApiProperty({ example: '2020-10-10 20:30' })
  @IsDateTimeString('YYYY-MM-DD HH:MM', {
    message: 'end date must be in the format YYYY-MM-DD HH:MM.',
  })
  @IsDateAfter('start', {
    message: 'end must be after start',
  })
  end: string;

  @ApiProperty({ example: '2020-09-02 14:23:12' })
  @IsDateTimeString('YYYY-MM-DD HH:MM:SS', {
    message: 'createdAt must be in the format YYYY-MM-DD HH:MM:SS.',
  })
  createdAt: string;

  @ApiProperty({ example: '2020-09-28 14:23:12' })
  @IsDateTimeString('YYYY-MM-DD HH:MM:SS', {
    message: 'updatedAt must be in the format YYYY-MM-DD HH:MM:SS.',
  })
  updatedAt: string;
}