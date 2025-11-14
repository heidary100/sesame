import {
  Injectable,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentDomain } from './domain/appointment.domain';
import { AppointmentMapper } from './mappers/appointment.mapper';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    private readonly dataSource: DataSource,
  ) { }

  async upsertAppointment(dto: CreateAppointmentDto): Promise<Appointment> {
    const incomingDomain = AppointmentMapper.toDomain(dto);

    return this.dataSource.transaction(async (manager) => {
      const existingEntity = await manager.findOne(Appointment, {
        where: { id: incomingDomain.id },
        lock: { mode: 'pessimistic_write' },
      });

      let currentDomain: AppointmentDomain;

      if (existingEntity) {
        currentDomain = AppointmentMapper.fromEntity(existingEntity);
        currentDomain.update({
          start: incomingDomain.start,
          end: incomingDomain.end,
          createdAt: incomingDomain.createdAt,
          updatedAt: incomingDomain.updatedAt,
        });

        // Save old state to history
        const oldHistory = AppointmentMapper.toHistoryDomain(
          AppointmentMapper.fromEntity(existingEntity)
        );
        await manager.save(AppointmentMapper.toHistoryEntity(oldHistory));
      } else {
        currentDomain = incomingDomain;
      }

      // Overlap check
      const others = await manager.find(Appointment, {
        where: { id: Not(currentDomain.id) },
      });

      const hasOverlap = others.some((e) => {
        const otherDomain = AppointmentMapper.fromEntity(e);
        return currentDomain.hasOverlap(otherDomain);
      });

      if (hasOverlap) {
        throw new ConflictException('The requested time range is not available.');
      }

      const entityToSave = AppointmentMapper.toEntity(currentDomain);
      return manager.save(entityToSave);
    });
  }

  async findCurrentAppointments(): Promise<Appointment[]> {
    return this.appointmentRepo.find({ order: { start: 'ASC' } });
  }
}