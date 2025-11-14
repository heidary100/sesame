import {
  Injectable,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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

    // Use different isolation levels: REPEATABLE_READ for production, READ_COMMITTED for testing
    // READ_COMMITTED is more compatible with pessimistic locking in test environments
    const isolationLevel = process.env.NODE_ENV === 'test' ? 'READ COMMITTED' : 'REPEATABLE READ';
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction(isolationLevel);

    try {
      // Lock ALL appointments to prevent concurrent modifications during overlap check
      const allAppointments = await queryRunner.manager.find(Appointment, {
        lock: { mode: 'pessimistic_write' },
      });

      const existingEntity = allAppointments.find(
        (a) => a.id === incomingDomain.id,
      );

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
          AppointmentMapper.fromEntity(existingEntity),
        );
        await queryRunner.manager.save(
          AppointmentMapper.toHistoryEntity(oldHistory),
        );
      } else {
        currentDomain = incomingDomain;
      }

      // Overlap check - now under full lock protection
      const others = allAppointments.filter(
        (a) => a.id !== currentDomain.id,
      );

      const hasOverlap = others.some((e) => {
        const otherDomain = AppointmentMapper.fromEntity(e);
        return currentDomain.hasOverlap(otherDomain);
      });

      if (hasOverlap) {
        throw new ConflictException(
          'The requested time range is not available.',
        );
      }

      const entityToSave = AppointmentMapper.toEntity(currentDomain);
      const savedEntity = await queryRunner.manager.save(entityToSave);

      await queryRunner.commitTransaction();
      return savedEntity;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findCurrentAppointments(
    limit: number = 100,
    offset: number = 0,
  ): Promise<Appointment[]> {
    return this.appointmentRepo.find({
      order: { start: 'ASC' },
      take: limit,
      skip: offset,
    });
  }
}
