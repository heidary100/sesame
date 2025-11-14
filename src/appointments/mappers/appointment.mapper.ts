import { Appointment } from '../entities/appointment.entity';
import { AppointmentHistory } from '../entities/appointment-history.entity';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { AppointmentDomain } from '../domain/appointment.domain';
import { AppointmentHistoryDomain } from '../domain/appointment-history.domain';

export class AppointmentMapper {
    static toDomain(dto: CreateAppointmentDto): AppointmentDomain {
        return new AppointmentDomain(
            dto.id,
            new Date(dto.start),
            new Date(dto.end),
            new Date(dto.createdAt),
            new Date(dto.updatedAt),
        );
    }

    static toEntity(domain: AppointmentDomain): Appointment {
        const entity = new Appointment();
        entity.id = domain.id;
        entity.start = domain.start;
        entity.end = domain.end;
        entity.createdAt = domain.createdAt;
        entity.updatedAt = domain.updatedAt;
        entity.version = domain.version;
        return entity;
    }

    static fromEntity(entity: Appointment): AppointmentDomain {
        return new AppointmentDomain(
            entity.id,
            entity.start,
            entity.end,
            entity.createdAt,
            entity.updatedAt,
            entity.version,
        );
    }

    static toHistoryDomain(domain: AppointmentDomain): AppointmentHistoryDomain {
        return new AppointmentHistoryDomain(
            domain.id,
            domain.start,
            domain.end,
            domain.createdAt,
            domain.updatedAt,
            domain.version,
            new Date(),
        );
    }

    static toHistoryEntity(history: AppointmentHistoryDomain): AppointmentHistory {
        const entity = new AppointmentHistory();
        entity.appointmentId = history.appointmentId;
        entity.start = history.start;
        entity.end = history.end;
        entity.createdAt = history.createdAt;
        entity.updatedAt = history.updatedAt;
        entity.version = history.version;
        entity.changedAt = history.changedAt;
        return entity;
    }
}