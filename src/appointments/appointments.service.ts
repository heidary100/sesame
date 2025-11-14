import { Injectable } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor() {} // private readonly dataSource: DataSource, // private readonly historyRepo: Repository<AppointmentHistory>, // @InjectRepository(AppointmentHistory) // private readonly appointmentRepo: Repository<Appointment>, // @InjectRepository(Appointment) // inject repositories later

  /**
   * Create or update an appointment.
   *
   * TDD: Write tests before you implement this.
   */
  async createOrUpdate(dto: CreateAppointmentDto): Promise<any> {
    // TODO: transactional implementation using TypeORM
    // TODO: throw BadRequestException for invalid dates
    // TODO: throw ConflictException for overlapping appointments
    // TODO: insert existing row into history table on update
    // TODO: return meaningful result object
    return {};
  }

  /**
   * Retrieve all latest appointments.
   *
   * TDD: Implement after writing controller/service tests.
   */
  async findAll(): Promise<any[]> {
    // TODO: return latest appointment records
    return [];
  }
}
