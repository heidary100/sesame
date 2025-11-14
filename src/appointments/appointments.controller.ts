import {
  Body,
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentsController {
  private readonly logger = new Logger(AppointmentsController.name);

  constructor(private readonly appointmentsService: AppointmentsService) {}

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
    this.logger.debug(
      `Upserting appointment: id=${dto.id}, start=${dto.start}, end=${dto.end}`,
    );
    const result = await this.appointmentsService.upsertAppointment(dto);
    this.logger.debug(
      `Successfully upserted appointment: id=${result.id}, version=${result.version}`,
    );
    return result;
  }

  @Get()
  @ApiOperation({ summary: 'Get a list of current (latest) appointments' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of appointments to return (default: 100, max: 1000)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of appointments to skip (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'Fetched all appointments successfully.',
  })
  async findAll(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    this.logger.debug(
      `Fetching appointments with limit=${limit}, offset=${offset}`,
    );

    let parsedLimit = 100;
    let parsedOffset = 0;

    if (limit) {
      parsedLimit = Math.min(parseInt(limit, 10), 1000);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        parsedLimit = 100;
      }
    }

    if (offset) {
      parsedOffset = Math.max(parseInt(offset, 10), 0);
      if (isNaN(parsedOffset)) {
        parsedOffset = 0;
      }
    }

    const appointments = await this.appointmentsService.findCurrentAppointments(
      parsedLimit,
      parsedOffset,
    );
    this.logger.debug(`Fetched ${appointments.length} appointments`);
    return appointments;
  }
}
