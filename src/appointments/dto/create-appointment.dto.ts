import {
  IsInt,
  IsDateString,
  IsDefined,
  IsPositive,
} from '@nestjs/class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({ example: 1 })
  @IsDefined()
  @IsInt()
  @IsPositive()
  id: number;

  @ApiProperty({ example: '2020-10-10T20:20:00Z' })
  @IsDefined()
  @IsDateString()
  start: string;

  @ApiProperty({ example: '2020-10-10T20:30:00Z' })
  @IsDefined()
  @IsDateString()
  end: string;

  @ApiProperty({ example: '2020-09-02T14:23:12Z' })
  @IsDefined()
  @IsDateString()
  createdAt: string;

  @ApiProperty({ example: '2020-09-28T14:23:12Z' })
  @IsDefined()
  @IsDateString()
  updatedAt: string;
}
