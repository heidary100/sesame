import { AppointmentMapper } from './appointment.mapper';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { AppointmentDomain } from '../domain/appointment.domain';
import { Appointment } from '../entities/appointment.entity';
import { AppointmentHistory } from '../entities/appointment-history.entity';
import { AppointmentHistoryDomain } from '../domain/appointment-history.domain';

describe('AppointmentMapper', () => {
  const mockDto: CreateAppointmentDto = {
    id: 1,
    start: '2020-10-10 20:20:00',
    end: '2020-10-10 20:30:00',
    createdAt: '2020-09-02 14:23:12',
    updatedAt: '2020-09-28 14:23:12',
  };

  const mockEntity: Appointment = {
    id: 2,
    start: new Date('2020-10-10T20:20:00Z'),
    end: new Date('2020-10-10T20:30:00Z'),
    createdAt: new Date('2020-09-02T14:23:12Z'),
    updatedAt: new Date('2020-09-28T14:23:12Z'),
    version: 1,
  };

  describe('toDomain', () => {
    it('should convert DTO to AppointmentDomain', () => {
      const domain = AppointmentMapper.toDomain(mockDto);

      expect(domain).toBeInstanceOf(AppointmentDomain);
      expect(domain.id).toBe(mockDto.id);
      expect(domain.start).toEqual(new Date(mockDto.start));
      expect(domain.end).toEqual(new Date(mockDto.end));
      expect(domain.createdAt).toEqual(new Date(mockDto.createdAt));
      expect(domain.updatedAt).toEqual(new Date(mockDto.updatedAt));
    });

    it('should convert string dates to Date objects', () => {
      const domain = AppointmentMapper.toDomain(mockDto);

      expect(domain.start).toBeInstanceOf(Date);
      expect(domain.end).toBeInstanceOf(Date);
      expect(domain.createdAt).toBeInstanceOf(Date);
      expect(domain.updatedAt).toBeInstanceOf(Date);
    });

    it('should preserve all DTO properties', () => {
      const domain = AppointmentMapper.toDomain(mockDto);

      expect(domain.id).toBe(1);
      expect(domain.version).toBe(1); // default version
    });

    it('should handle multiple different DTOs', () => {
      const dto2: CreateAppointmentDto = {
        id: 99,
        start: '2025-01-01 10:00:00',
        end: '2025-01-01 11:00:00',
        createdAt: '2024-01-01 10:00:00',
        updatedAt: '2024-12-31 15:30:00',
      };

      const domain = AppointmentMapper.toDomain(dto2);

      expect(domain.id).toBe(99);
      expect(domain.start.getFullYear()).toBe(2025);
    });
  });

  describe('toEntity', () => {
    it('should convert AppointmentDomain to Appointment entity', () => {
      const domain = new AppointmentDomain(
        mockEntity.id,
        mockEntity.start,
        mockEntity.end,
        mockEntity.createdAt,
        mockEntity.updatedAt,
        mockEntity.version,
      );

      const entity = AppointmentMapper.toEntity(domain);

      expect(entity).toBeInstanceOf(Appointment);
      expect(entity.id).toBe(domain.id);
      expect(entity.start).toEqual(domain.start);
      expect(entity.end).toEqual(domain.end);
      expect(entity.createdAt).toEqual(domain.createdAt);
      expect(entity.updatedAt).toEqual(domain.updatedAt);
      expect(entity.version).toBe(domain.version);
    });

    it('should preserve version number', () => {
      const domain = new AppointmentDomain(
        1,
        new Date('2020-10-10T20:20:00Z'),
        new Date('2020-10-10T20:30:00Z'),
        new Date('2020-09-02T14:23:12Z'),
        new Date('2020-09-28T14:23:12Z'),
        5,
      );

      const entity = AppointmentMapper.toEntity(domain);

      expect(entity.version).toBe(5);
    });

    it('should create new entity instance', () => {
      const domain1 = AppointmentMapper.toDomain(mockDto);
      const entity1 = AppointmentMapper.toEntity(domain1);

      const domain2 = AppointmentMapper.toDomain(mockDto);
      const entity2 = AppointmentMapper.toEntity(domain2);

      expect(entity1).not.toBe(entity2);
      expect(entity1.id).toBe(entity2.id);
    });

    it('should handle domains with high version numbers', () => {
      const domain = new AppointmentDomain(
        1,
        new Date(),
        new Date(Date.now() + 3600000),
        new Date(),
        new Date(),
        999,
      );

      const entity = AppointmentMapper.toEntity(domain);

      expect(entity.version).toBe(999);
    });
  });

  describe('fromEntity', () => {
    it('should convert Appointment entity to AppointmentDomain', () => {
      const domain = AppointmentMapper.fromEntity(mockEntity);

      expect(domain).toBeInstanceOf(AppointmentDomain);
      expect(domain.id).toBe(mockEntity.id);
      expect(domain.start).toEqual(mockEntity.start);
      expect(domain.end).toEqual(mockEntity.end);
      expect(domain.createdAt).toEqual(mockEntity.createdAt);
      expect(domain.updatedAt).toEqual(mockEntity.updatedAt);
      expect(domain.version).toBe(mockEntity.version);
    });

    it('should preserve all entity properties including version', () => {
      const entity: Appointment = {
        id: 42,
        start: new Date('2020-01-01T00:00:00Z'),
        end: new Date('2020-01-01T01:00:00Z'),
        createdAt: new Date('2019-01-01T00:00:00Z'),
        updatedAt: new Date('2020-01-01T00:00:00Z'),
        version: 7,
      };

      const domain = AppointmentMapper.fromEntity(entity);

      expect(domain.id).toBe(42);
      expect(domain.version).toBe(7);
    });

    it('should reconstruct domain from entity correctly', () => {
      const originalDomain = AppointmentMapper.toDomain(mockDto);
      const entity = AppointmentMapper.toEntity(originalDomain);
      const reconstructed = AppointmentMapper.fromEntity(entity);

      expect(reconstructed.id).toBe(originalDomain.id);
      expect(reconstructed.start.getTime()).toBe(originalDomain.start.getTime());
      expect(reconstructed.end.getTime()).toBe(originalDomain.end.getTime());
    });
  });

  describe('toHistoryDomain', () => {
    it('should convert AppointmentDomain to AppointmentHistoryDomain', () => {
      const domain = AppointmentMapper.toDomain(mockDto);
      const beforeTime = Date.now();
      const history = AppointmentMapper.toHistoryDomain(domain);
      const afterTime = Date.now();

      expect(history).toBeInstanceOf(AppointmentHistoryDomain);
      expect(history.appointmentId).toBe(domain.id);
      expect(history.start).toEqual(domain.start);
      expect(history.end).toEqual(domain.end);
      expect(history.version).toBe(domain.version);
      expect(history.changedAt.getTime()).toBeGreaterThanOrEqual(beforeTime);
      expect(history.changedAt.getTime()).toBeLessThanOrEqual(afterTime);
    });

    it('should capture current timestamp for changedAt', async () => {
      const domain = AppointmentMapper.toDomain(mockDto);
      const history1 = AppointmentMapper.toHistoryDomain(domain);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const history2 = AppointmentMapper.toHistoryDomain(domain);

      expect(history2.changedAt.getTime()).toBeGreaterThanOrEqual(
        history1.changedAt.getTime(),
      );
    });

    it('should create independent history entries', () => {
      const domain = AppointmentMapper.toDomain(mockDto);
      const history1 = AppointmentMapper.toHistoryDomain(domain);
      const history2 = AppointmentMapper.toHistoryDomain(domain);

      expect(history1).not.toBe(history2);
      expect(history1.appointmentId).toBe(history2.appointmentId);
    });
  });

  describe('toHistoryEntity', () => {
    it('should convert AppointmentHistoryDomain to AppointmentHistory entity', () => {
      const domain = AppointmentMapper.toDomain(mockDto);
      const historyDomain = AppointmentMapper.toHistoryDomain(domain);
      const entity = AppointmentMapper.toHistoryEntity(historyDomain);

      expect(entity).toBeInstanceOf(AppointmentHistory);
      expect(entity.appointmentId).toBe(historyDomain.appointmentId);
      expect(entity.start).toEqual(historyDomain.start);
      expect(entity.end).toEqual(historyDomain.end);
      expect(entity.version).toBe(historyDomain.version);
      expect(entity.changedAt).toEqual(historyDomain.changedAt);
    });

    it('should preserve all history properties', () => {
      const historyDomain = new AppointmentHistoryDomain(
        5,
        new Date('2020-10-10T20:20:00Z'),
        new Date('2020-10-10T20:30:00Z'),
        new Date('2020-09-02T14:23:12Z'),
        new Date('2020-09-28T14:23:12Z'),
        3,
        new Date('2020-09-29T10:00:00Z'),
      );

      const entity = AppointmentMapper.toHistoryEntity(historyDomain);

      expect(entity.appointmentId).toBe(5);
      expect(entity.version).toBe(3);
      expect(entity.changedAt).toEqual(new Date('2020-09-29T10:00:00Z'));
    });

    it('should create new entity instance each time', () => {
      const domain = AppointmentMapper.toDomain(mockDto);
      const historyDomain = AppointmentMapper.toHistoryDomain(domain);

      const entity1 = AppointmentMapper.toHistoryEntity(historyDomain);
      const entity2 = AppointmentMapper.toHistoryEntity(historyDomain);

      expect(entity1).not.toBe(entity2);
    });
  });

  describe('round-trip conversions', () => {
    it('should preserve data through DTO -> Domain -> Entity -> Domain conversion', () => {
      const domain1 = AppointmentMapper.toDomain(mockDto);
      const entity = AppointmentMapper.toEntity(domain1);
      const domain2 = AppointmentMapper.fromEntity(entity);

      expect(domain2.id).toBe(domain1.id);
      expect(domain2.start.getTime()).toBe(domain1.start.getTime());
      expect(domain2.end.getTime()).toBe(domain1.end.getTime());
      expect(domain2.version).toBe(domain1.version);
    });

    it('should handle full pipeline: DTO -> Domain -> History Domain -> History Entity', () => {
      const domain = AppointmentMapper.toDomain(mockDto);
      const historyDomain = AppointmentMapper.toHistoryDomain(domain);
      const historyEntity = AppointmentMapper.toHistoryEntity(historyDomain);

      expect(historyEntity.appointmentId).toBe(mockDto.id);
      expect(historyEntity.start).toEqual(new Date(mockDto.start));
      expect(historyEntity.end).toEqual(new Date(mockDto.end));
    });
  });

  describe('edge cases', () => {
    it('should handle minimum valid appointment ID', () => {
      const dto: CreateAppointmentDto = {
        id: 1,
        start: '2020-01-01 00:00',
        end: '2020-01-01 01:00',
        createdAt: '2020-01-01 00:00',
        updatedAt: '2020-01-01 00:00',
      };

      const domain = AppointmentMapper.toDomain(dto);
      const entity = AppointmentMapper.toEntity(domain);

      expect(entity.id).toBe(1);
    });

    it('should handle large appointment ID', () => {
      const dto: CreateAppointmentDto = {
        id: 2147483647,
        start: '2020-01-01 00:00',
        end: '2020-01-01 01:00',
        createdAt: '2020-01-01 00:00',
        updatedAt: '2020-01-01 00:00',
      };

      const domain = AppointmentMapper.toDomain(dto);

      expect(domain.id).toBe(2147483647);
    });

    it('should handle appointments with same start and different microsecond precision', () => {
      const domain = new AppointmentDomain(
        1,
        new Date('2020-10-10T20:20:00.123Z'),
        new Date('2020-10-10T20:30:00.456Z'),
        new Date('2020-09-02T14:23:12.789Z'),
        new Date('2020-09-28T14:23:12.999Z'),
      );

      const entity = AppointmentMapper.toEntity(domain);
      const reconstructed = AppointmentMapper.fromEntity(entity);

      expect(reconstructed.start.getTime()).toBe(domain.start.getTime());
      expect(reconstructed.end.getTime()).toBe(domain.end.getTime());
    });
  });
});
