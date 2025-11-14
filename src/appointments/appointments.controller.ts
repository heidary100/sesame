import {
  Body,
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create or update an appointment' })
  @ApiBody({ type: CreateAppointmentDto })
  @ApiResponse({
    status: 201,
    description: 'Appointment created or updated successfully.',
  })
  @ApiResponse({ status: 400, description: 'Invalid data provided.' })
  @ApiResponse({
    status: 409,
    description: 'Appointment time range overlaps with another appointment.',
  })
  async create(@Body() dto: CreateAppointmentDto) {
    try {
      const result = await this.appointmentsService.upsertAppointment(dto);
      return result;
    } catch (error) {
      console.error('Error in create appointment:', error);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get a list of current (latest) appointments' })
  @ApiResponse({
    status: 200,
    description: 'Fetched all appointments successfully.',
  })
  async findAll() {
    return this.appointmentsService.findCurrentAppointments();
  }
}
